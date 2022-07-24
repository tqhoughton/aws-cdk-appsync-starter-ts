import {
  CfnOutput,
  Duration,
  Expiration,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import * as appsync from "@aws-cdk/aws-appsync-alpha";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cognito from "aws-cdk-lib/aws-cognito";

// custom constructs
import * as custom from "./constructs";

export class AppSyncApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const orgTable = new dynamodb.Table(this, "orgTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const menuTable = new dynamodb.Table(this, "menuTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    menuTable.addGlobalSecondaryIndex({
      indexName: "by_organizationId_updatedAt",
      partitionKey: {
        name: "organizationId",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: "updatedAt", type: dynamodb.AttributeType.STRING },
    });

    const menuItemsTable = new dynamodb.Table(this, "menuItemsTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    menuItemsTable.addGlobalSecondaryIndex({
      indexName: "by_organizationId_normalizedName",
      partitionKey: {
        name: "organizationId",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: "normalizedName", type: dynamodb.AttributeType.STRING },
    });

    const publicApi = new appsync.GraphqlApi(this, "publicApi", {
      name: "menu-api-public",
      schema: appsync.Schema.fromAsset("build/public.graphql"),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: Expiration.after(Duration.days(365)),
          },
        },
      },
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
      },
    });

    const userPool = new cognito.UserPool(this, "menuApiUserPool", {
      signInAliases: {
        email: true,
      },
      passwordPolicy: {
        requireDigits: false,
        requireLowercase: false,
        requireSymbols: false,
        requireUppercase: false,
      },
    });

    userPool.addClient("menuApiWebClient", {
      accessTokenValidity: Duration.hours(1),
      idTokenValidity: Duration.hours(1),
      refreshTokenValidity: Duration.days(365),
    });

    const privateApi = new appsync.GraphqlApi(this, "privateApi", {
      name: "menu-api-private",
      schema: appsync.Schema.fromAsset("build/private.graphql"),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            defaultAction: appsync.UserPoolDefaultAction.ALLOW,
            userPool: userPool,
          },
        },
      },
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
      },
    });

    const defaultEnvironment = {
      MENU_ITEM_TABLE: menuItemsTable.tableName,
      MENU_TABLE: menuTable.tableName,
      ORG_TABLE: orgTable.tableName,
    };

    const defaultResponseMappingTemplate = appsync.MappingTemplate.fromString(
      "$util.toJson($ctx.result)"
    );

    const createOrganization = new custom.NodeJSLambdaResolver(
      this,
      "createOrganization",
      {
        api: privateApi,
        lambdaProps: {
          entry: "src/resolvers/createOrganization.ts",
          environment: defaultEnvironment,
        },
        resolverProps: {
          typeName: "Mutation",
          fieldName: "createOrganization",
        },
      }
    );

    orgTable.grantWriteData(createOrganization.lambda);

    const createMenuFunction = new custom.NodeJSLambdaAppSyncFunction(
      this,
      "createMenu",
      {
        api: privateApi,
        lambdaProps: {
          entry: "src/resolvers/createMenu.ts",
          environment: defaultEnvironment,
        },
      }
    );

    menuTable.grantWriteData(createMenuFunction.lambda);

    const validateOrgFunction = new custom.NodeJSLambdaAppSyncFunction(
      this,
      "validateOrganization",
      {
        api: privateApi,
        lambdaProps: {
          entry: "src/auth/validateOrganization.ts",
          environment: defaultEnvironment,
        },
        appsyncFunctionProps: {
          responseMappingTemplate: appsync.MappingTemplate.fromString(
            [
              "#if($ctx.error)",
              "  $util.error($ctx.error.message, $ctx.error.type)",
              "#end",
              "$util.toJson($ctx.result)",
            ].join("\n")
          ),
        },
      }
    );

    orgTable.grantReadData(validateOrgFunction.lambda);

    const createMenu = privateApi.createResolver({
      pipelineConfig: [
        validateOrgFunction.function,
        createMenuFunction.function,
      ],
      typeName: "Mutation",
      fieldName: "createMenu",
      requestMappingTemplate: appsync.MappingTemplate.fromString(
        [
          '$util.qr($ctx.stash.put("organizationId", $ctx.args.input.organizationId))',
          '$util.qr($ctx.stash.put("userId", $ctx.identity.sub))',
          "{}",
        ].join("\n")
      ),
      responseMappingTemplate: defaultResponseMappingTemplate,
    });

    const createMenuItemFunction = new custom.NodeJSLambdaAppSyncFunction(
      this,
      "createMenuItem",
      {
        api: privateApi,
        lambdaProps: {
          entry: "src/resolvers/createMenuItem.ts",
          environment: defaultEnvironment,
        },
      }
    );

    menuItemsTable.grantWriteData(createMenuItemFunction.lambda);

    const createMenuItem = privateApi.createResolver({
      pipelineConfig: [
        validateOrgFunction.function,
        createMenuItemFunction.function,
      ],
      typeName: "Mutation",
      fieldName: "createMenuItem",
      requestMappingTemplate: appsync.MappingTemplate.fromString(
        [
          '$util.qr($ctx.stash.put("organizationId", $ctx.args.input.organizationId))',
          '$util.qr($ctx.stash.put("userId", $ctx.identity.sub))',
          "{}",
        ].join("\n")
      ),
      responseMappingTemplate: defaultResponseMappingTemplate,
    });

    // shared resolvers
    const getMenuLambda = new lambda.NodejsFunction(this, "getMenuLambda", {
      entry: "src/resolvers/getMenu.ts",
      environment: defaultEnvironment,
    });

    menuTable.grantReadData(getMenuLambda);

    const getMenuItemsLambda = new lambda.NodejsFunction(
      this,
      "getMenuItemsLambda",
      {
        entry: "src/resolvers/getMenuItems.ts",
        environment: defaultEnvironment,
      }
    );

    menuItemsTable.grantReadData(getMenuItemsLambda);

    const apis = [
      { api: publicApi, type: "Public" },
      { api: privateApi, type: "Private" },
    ];

    // shared lambda resolvers
    apis.forEach(({ api, type }) => {
      new custom.NodeJSLambdaResolver(this, "getMenu" + type, {
        api,
        lambda: getMenuLambda,
        resolverProps: {
          typeName: "Query",
          fieldName: "getMenu",
        },
      });

      new custom.NodeJSLambdaResolver(this, "getMenuItems" + type, {
        api,
        lambda: getMenuItemsLambda,
        resolverProps: {
          typeName: "Section",
          fieldName: "menuItems",
          maxBatchSize: 25,
        },
      });
    });

    // start of cfn outputs
    new CfnOutput(this, "PublicApiUrl", {
      value: publicApi.graphqlUrl,
    });

    new CfnOutput(this, "PrivateApiUrl", {
      value: privateApi.graphqlUrl,
    });

    // Prints out the AppSync GraphQL API key to the terminal
    new CfnOutput(this, "PublicApiKey", {
      value: publicApi.apiKey || "",
    });
  }
}
