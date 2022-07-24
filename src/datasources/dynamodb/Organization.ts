import { DynamoDBDatasource } from "./Dynamodb";
import { v4 as uuid } from "uuid";

type OrganizationDataModel = {
  id: string;
  name: string;
  owner: string;
  members: Set<string>;
};

export class OrganizationDatasource extends DynamoDBDatasource {
  async create(orgInput: Omit<OrganizationDataModel, "id">) {
    const org: OrganizationDataModel = {
      ...orgInput,
      id: uuid(),
    };

    await this.ddb.put({
      TableName: this.tableName,
      Item: org,
    });

    return org;
  }
}
