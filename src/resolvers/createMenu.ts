import { AppSyncResolverEvent } from "aws-lambda";
import { getDocumentClient } from "src/datasources/dynamodb/utils/dynamodb";
import {
  MutationCreateMenuArgs,
  ResolversParentTypes,
} from "graphql/private/types.generated";
import { getEnvironmentVariable } from "src/utils/env";
import { MenuDatasource } from "src/datasources/dynamodb";
import { createLogger } from "src/utils/logger";

const documentClient = getDocumentClient();
const menuTable = getEnvironmentVariable("MENU_TABLE");

const menus = new MenuDatasource(menuTable, documentClient);
const logger = createLogger("mutatation", "createMenu");

export async function handler(
  event: AppSyncResolverEvent<MutationCreateMenuArgs>
): Promise<ResolversParentTypes["CreateMenuOutput"]> {
  logger.info({ event });
  const { input } = event.arguments;

  const menu = await menus.create(input);

  return {
    menu,
  };
}
