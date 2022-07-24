import { AppSyncResolverEvent } from "aws-lambda";
import { getDocumentClient } from "src/datasources/dynamodb/utils/dynamodb";
import { Section } from "graphql/shared/types.generated";
import { getEnvironmentVariable } from "src/utils/env";
import { MenuItem } from "graphql/private/types.generated";
import { MenuItemDatasource } from "src/datasources/dynamodb";
import { createLogger } from "src/utils/logger";

const documentClient = getDocumentClient();
const menuItemsTable = getEnvironmentVariable("MENU_ITEM_TABLE");

const menus = new MenuItemDatasource(menuItemsTable, documentClient);
const logger = createLogger("Section", "menuItems");

type GetMenuItemSource = Omit<Section, "menuItems"> & {
  menuItems: { id: string }[];
};

export async function handler(
  events: AppSyncResolverEvent<null, GetMenuItemSource>[]
): Promise<MenuItem[][]> {
  logger.info({ events });

  const menuItemKeys: Set<string> = new Set();

  // get all unique menu item keys in the batch of events
  events.forEach((event) => {
    const source = event.source;

    source.menuItems.forEach((item) => menuItemKeys.add(item.id));
  });

  const uniqueIds = [...menuItemKeys];

  const items = await menus.batchGetById(uniqueIds);

  const itemsMap = items.reduce((map, item) => {
    map[item.id] = item;

    return map;
  }, {} as Record<string, MenuItem>);

  // return the correct menuItems for each incoming request
  return events.map((event) => {
    const eventIds = event.source.menuItems.map((item) => item.id);
    return eventIds.map((id) => itemsMap[id]);
  });
}
