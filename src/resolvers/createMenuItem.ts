import { AppSyncResolverEvent } from "aws-lambda";
import {
  getDocumentClient,
  removeAllNullProperties,
} from "src/datasources/dynamodb/utils/dynamodb";
import {
  Mutation,
  MutationCreateMenuItemArgs,
  MenuItem,
} from "graphql/private/types.generated";
import { getEnvironmentVariable } from "src/utils/env";
import { MenuItemDatasource } from "src/datasources/dynamodb";
import { createLogger } from "src/utils/logger";

const documentClient = getDocumentClient();
const menuItemsTable = getEnvironmentVariable("MENU_ITEM_TABLE");

const menuItems = new MenuItemDatasource(menuItemsTable, documentClient);
const logger = createLogger("mutatation", "createMenuItem");

export async function handler(
  event: AppSyncResolverEvent<MutationCreateMenuItemArgs>
): Promise<Mutation["createMenuItem"]> {
  logger.info({ event });

  const { input } = event.arguments;

  const menuItem = await menuItems.create(removeAllNullProperties(input));

  return {
    menuItem,
  };
}
