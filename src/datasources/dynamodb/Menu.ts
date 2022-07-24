import { DynamoDBDatasource } from "./Dynamodb";
import { v4 as uuid } from "uuid";
import { withTimestamps } from "./utils";

export type MenuDataModel = {
  id: string;
  organizationId: string;
  name: string;
  sections: Array<{
    id: string;
    name: string;
    menuItems: Array<{
      id: string;
    }>;
  }>;
  createdAt: string;
  updatedAt: string;
};

type CreateMenuInput = Omit<
  MenuDataModel,
  "id" | "updatedAt" | "createdAt" | "sections"
> & {
  sections: {
    name: string;
    menuItems: { id: string }[];
  }[];
};

export class MenuDatasource extends DynamoDBDatasource {
  async create(menuInput: CreateMenuInput) {
    const menu: MenuDataModel = {
      ...menuInput,
      ...withTimestamps(),
      id: uuid(),
      sections: menuInput.sections.map((section) => ({
        ...section,
        id: uuid(),
      })),
    };

    await this.ddb.put({
      TableName: this.tableName,
      Item: menu,
    });

    return menu;
  }

  async getById(id: string): Promise<MenuDataModel | null> {
    const { Item: item } = await this.ddb.get({
      TableName: this.tableName,
      Key: {
        id,
      },
    });

    return (item as MenuDataModel) ?? null;
  }
}
