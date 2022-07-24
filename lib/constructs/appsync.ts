import * as appsync from "@aws-cdk/aws-appsync-alpha";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

export interface NodeJSLambdaResolverProps {
  api: appsync.GraphqlApi;
  lambdaProps?: lambda.NodejsFunctionProps;
  resolverProps: appsync.BaseResolverProps;
  lambda?: lambda.NodejsFunction;
}

export class NodeJSLambdaResolver extends Construct {
  public readonly lambda: lambda.NodejsFunction;
  public readonly datasource: appsync.LambdaDataSource;
  public readonly resolver: appsync.Resolver;

  constructor(scope: Construct, id: string, props: NodeJSLambdaResolverProps) {
    super(scope, id);

    const { resolverProps, api, lambdaProps, lambda: existingLambda } = props;

    if (!existingLambda) {
      this.lambda = new lambda.NodejsFunction(this, id + "_lambda", {
        ...lambdaProps,
      });
    } else {
      this.lambda = existingLambda;
    }

    this.datasource = api.addLambdaDataSource(id + "_datasource", this.lambda);
    this.resolver = this.datasource.createResolver(resolverProps);
  }
}

export interface NodeJSLambdaAppSyncFunctionProps {
  api: appsync.GraphqlApi;
  lambdaProps?: lambda.NodejsFunctionProps;
  appsyncFunctionProps?: Partial<appsync.BaseAppsyncFunctionProps>;
  lambda?: lambda.NodejsFunction;
}

export class NodeJSLambdaAppSyncFunction extends Construct {
  public readonly lambda: lambda.NodejsFunction;
  public readonly datasource: appsync.LambdaDataSource;
  public readonly function: appsync.AppsyncFunction;

  constructor(
    scope: Construct,
    id: string,
    props: NodeJSLambdaAppSyncFunctionProps
  ) {
    super(scope, id);

    const {
      appsyncFunctionProps,
      api,
      lambdaProps,
      lambda: existingLambda,
    } = props;

    if (!existingLambda) {
      this.lambda = new lambda.NodejsFunction(this, id + "_lambda", {
        ...lambdaProps,
      });
    } else {
      this.lambda = existingLambda;
    }

    this.datasource = api.addLambdaDataSource(id + "_datasource", this.lambda);
    this.function = this.datasource.createFunction({
      name: id,
      ...appsyncFunctionProps,
    });
  }
}
