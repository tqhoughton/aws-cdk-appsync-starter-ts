import {
  AmplifyAppSyncSimulator,
  AppSyncSimulatorDataSourceLambdaConfig,
  AppSyncSimulatorDataSourceType,
  AppSyncSimulatorUnitResolverConfig,
  RESOLVER_KIND,
} from "amplify-appsync-simulator";
import {
  directLambdaBatchRequestTemplate,
  directLambdaRequestTemplate,
  directLambdaResponseTemplate,
} from "test/utils";
import { makeRequest, createPublicApi } from "./utils";
import { handler } from "src/resolvers/getMenuItems";
import {
  getDocumentClient,
  withTimestamps,
} from "src/datasources/dynamodb/utils";
import { MenuItemDataModel } from "src/datasources/dynamodb";
import omit from "lodash.omit";
import { v4 as uuid } from "uuid";

const menuResolverFn = jest.fn().mockReturnValue({
  sections: [
    {
      menuItems: [],
    },
  ],
});

const getMenuDatasource: AppSyncSimulatorDataSourceLambdaConfig = {
  type: AppSyncSimulatorDataSourceType.Lambda,
  name: "getMenuLambda",
  invoke: menuResolverFn,
} as AppSyncSimulatorDataSourceLambdaConfig;

const getMenuResolver: AppSyncSimulatorUnitResolverConfig = {
  kind: RESOLVER_KIND.UNIT,
  typeName: "Query",
  fieldName: "getMenu",
  dataSourceName: "getMenuLambda",
  requestMappingTemplate: directLambdaRequestTemplate,
  responseMappingTemplate: directLambdaResponseTemplate,
};

const getMenuItemsDatasource: AppSyncSimulatorDataSourceLambdaConfig = {
  type: AppSyncSimulatorDataSourceType.Lambda,
  name: "getMenuItemsLambda",
  invoke: handler,
} as AppSyncSimulatorDataSourceLambdaConfig;

const getMenuItemsResolver: AppSyncSimulatorUnitResolverConfig = {
  kind: RESOLVER_KIND.UNIT,
  typeName: "Section",
  fieldName: "menuItems",
  dataSourceName: "getMenuItemsLambda",
  requestMappingTemplate: directLambdaBatchRequestTemplate,
  responseMappingTemplate: directLambdaResponseTemplate,
  maxBatchSize: 25,
} as AppSyncSimulatorUnitResolverConfig;

let api: AmplifyAppSyncSimulator;
let port: number;

beforeAll(async () => {
  ({ api, port } = await createPublicApi(
    [getMenuDatasource, getMenuItemsDatasource],
    [getMenuResolver, getMenuItemsResolver]
  ));
});

afterAll(async () => {
  api.stop();
});

const query = `
  query($id: ID!) {
    getMenu(id: $id) {
      sections {
        menuItems {
          id
          name
          description
          price
          image {
            url
          }
        }
      }
    }
  }
`;

describe("[public] Section.menuItems", () => {
  test("returns an empty array if section does not have any menu items (for some reason)", async () => {
    const data = await makeRequest(port, query, { id: "some-id" });

    expect(data).toEqual({
      getMenu: {
        sections: [
          {
            menuItems: [],
          },
        ],
      },
    });
  });

  test("returns menuItems in the same order that the IDs are defined", async () => {
    const ddb = getDocumentClient();

    const existingMenuItem1: MenuItemDataModel = {
      id: uuid(),
      name: "Chips and Guac",
      organizationId: "some-org-id",
      description:
        "Our zesty chips and guac, comes with sour cream upon request. Get it while it lasts!",
      price: 9.99,
      image: {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Guacomole.jpg/1920px-Guacomole.jpg",
      },
      ...withTimestamps(),
    };

    await ddb.put({
      TableName: process.env.MENU_ITEM_TABLE!,
      Item: existingMenuItem1,
    });

    const existingMenuItem2: MenuItemDataModel = {
      id: uuid(),
      name: "Chips and Salsa",
      organizationId: "some-org-id",
      description:
        "Our zesty chips and salsa, comes with sour cream upon request. Get it while it lasts!",
      price: 9.99,
      image: {
        url: "https://upload.wikimedia.org/wikipedia/commons/a/a7/Flickr_-_cyclonebill_-_Chips_og_salsa_%281%29.jpg",
      },
      ...withTimestamps(),
    };

    await ddb.put({
      TableName: process.env.MENU_ITEM_TABLE!,
      Item: existingMenuItem2,
    });

    menuResolverFn.mockReturnValue({
      sections: [
        {
          menuItems: [
            { id: existingMenuItem1.id },
            { id: existingMenuItem2.id },
          ],
        },
      ],
    });

    const data = await makeRequest(port, query, { id: "some-id" });

    expect(data).toEqual({
      getMenu: {
        sections: [
          {
            menuItems: [
              omit(
                existingMenuItem1,
                "createdAt",
                "updatedAt",
                "organizationId"
              ),
              omit(
                existingMenuItem2,
                "createdAt",
                "updatedAt",
                "organizationId"
              ),
            ],
          },
        ],
      },
    });
  });
});
