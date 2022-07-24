import {
  AmplifyAppSyncSimulator,
  AppSyncSimulatorDataSourceLambdaConfig,
  AppSyncSimulatorDataSourceType,
  AppSyncSimulatorUnitResolverConfig,
  RESOLVER_KIND,
} from "amplify-appsync-simulator";
import {
  directLambdaRequestTemplate,
  directLambdaResponseTemplate,
} from "test/utils";
import { makeRequest, createPrivateApi, getMockToken } from "./utils";
import { handler } from "src/resolvers/getMenu";
import {
  getDocumentClient,
  withTimestamps,
} from "src/datasources/dynamodb/utils";
import { MenuDataModel } from "src/datasources/dynamodb";

const getMenuDatasource: AppSyncSimulatorDataSourceLambdaConfig = {
  type: AppSyncSimulatorDataSourceType.Lambda,
  name: "getMenuLambda",
  invoke: handler,
} as AppSyncSimulatorDataSourceLambdaConfig;

const getMenuResolver: AppSyncSimulatorUnitResolverConfig = {
  kind: RESOLVER_KIND.UNIT,
  typeName: "Query",
  fieldName: "getMenu",
  dataSourceName: "getMenuLambda",
  requestMappingTemplate: directLambdaRequestTemplate,
  responseMappingTemplate: directLambdaResponseTemplate,
};

let api: AmplifyAppSyncSimulator;
let port: number;

beforeAll(async () => {
  ({ api, port } = await createPrivateApi(
    [getMenuDatasource],
    [getMenuResolver]
  ));
});

afterAll(async () => {
  api.stop();
});

const query = `
  query($id: ID!) {
    getMenu(id: $id) {
      id
      name
      organizationId
      createdAt
      updatedAt
      sections {
        id
        name
        menuItems {
          id
        }
      }
    }
  }
`;

const token = getMockToken("alice");

describe("[private] getMenu", () => {
  test("returns null if no menu with the given ID exists", async () => {
    const data = await makeRequest(port, query, { id: "some-bogus-id" }, token);

    expect(data).toEqual({
      getMenu: null,
    });
  });

  test("returns a menu if one with the ID is found with createdAt and updatedAt", async () => {
    const ddb = getDocumentClient();

    const existingMenu: MenuDataModel = {
      id: "some-id",
      name: "My Cool Menu",
      organizationId: "some-org-id",
      sections: [
        {
          id: "section-1",
          name: "Appetizers",
          menuItems: [
            {
              id: "menu-item-1",
            },
          ],
        },
      ],
      ...withTimestamps(),
    };

    await ddb.put({
      TableName: process.env.MENU_TABLE!,
      Item: existingMenu,
    });

    const data = await makeRequest(port, query, { id: "some-id" }, token);

    expect(data).toEqual({
      getMenu: existingMenu,
    });
  });
});
