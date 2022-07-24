import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

export class DynamoDBDatasource {
  constructor(protected tableName: string, protected ddb: DynamoDBDocument) {}
}
