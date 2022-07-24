import { DynamoDBDatasource } from "./Dynamodb";
import { v4 as uuid } from "uuid";
import { batchGetAll, withTimestamps } from "./utils";

export type MenuItemDataModel = {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  image?: { url: string };
  price?: number;
  createdAt: string;
  updatedAt: string;
};

export class MenuItemDatasource extends DynamoDBDatasource {
  async create(
    menuItemInput: Omit<MenuItemDataModel, "id" | "updatedAt" | "createdAt">
  ) {
    const menuItem: MenuItemDataModel = {
      ...menuItemInput,
      ...withTimestamps(),
      id: uuid(),
    };

    await this.ddb.put({
      TableName: this.tableName,
      Item: menuItem,
    });

    return menuItem;
  }

  async batchGetById(ids: string[]): Promise<MenuItemDataModel[]> {
    const keys = ids.map((id) => ({ id }));

    return batchGetAll<MenuItemDataModel>(this.ddb, this.tableName, keys);
  }
}
