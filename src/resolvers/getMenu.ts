import { AppSyncResolverEvent } from "aws-lambda";
import { getDocumentClient } from "src/datasources/dynamodb/utils/dynamodb";
import {
  QueryGetMenuArgs,
  Maybe,
  ResolversParentTypes,
} from "graphql/shared/types.generated";
import { getEnvironmentVariable } from "src/utils/env";
import { MenuDatasource } from "src/datasources/dynamodb";
import { createLogger } from "src/utils/logger";

const documentClient = getDocumentClient();
const menuTable = getEnvironmentVariable("MENU_TABLE");
const menus = new MenuDatasource(menuTable, documentClient);
const logger = createLogger("query", "getMenu");

export async function handler(
  event: AppSyncResolverEvent<QueryGetMenuArgs>
): Promise<Maybe<ResolversParentTypes["Menu"]>> {
  logger.info({ event });

  const { id } = event.arguments;

  const menu = await menus.getById(id);

  return menu;
}
