import { BatchGetCommandInput, DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import chunk from "lodash.chunk";
import sleep from "src/utils/sleep";

export function getDocumentClient() {
  const isTest = process.env.JEST_WORKER_ID;
  const client = new DynamoDBClient({
    ...(isTest && {
      endpoint: "http://localhost:8000",
      sslEnabled: false,
      region: "local-env",
    }),
  });

  const ddbDocClient = DynamoDBDocument.from(client, {
    marshallOptions: { convertEmptyValues: true },
  });

  return ddbDocClient;
}

export const MAX_BATCH_READ_SIZE = 100;

export function buildBatchGetRequest(
  keys: Record<string, any>[],
  tableName: string
): BatchGetCommandInput {
  return {
    RequestItems: {
      [tableName]: {
        Keys: keys,
      },
    },
  };
}

type WithoutNullableKeys<Type> = {
  [Key in keyof Type]-?: WithoutNullableKeys<NonNullable<Type[Key]>>;
};

export function removeAllNullProperties<T extends Record<string, any>>(
  obj: T
): WithoutNullableKeys<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v != null)
  ) as WithoutNullableKeys<T>;
}

export async function recursiveBatchGet<T extends Record<string, any>>(
  ddb: DynamoDBDocument,
  tableName: string,
  keys: Record<string, any>[],
  attempt = 0
): Promise<T[]> {
  const batchRequest = buildBatchGetRequest(keys, tableName);
  const requestedItems = await ddb.batchGet(batchRequest);

  const items = requestedItems.Responses![tableName] as T[];

  if (requestedItems.UnprocessedKeys?.[tableName] && attempt < 3) {
    await sleep(500 * attempt++);
    const additionalItems = await recursiveBatchGet<T>(
      ddb,
      tableName,
      requestedItems.UnprocessedKeys![tableName].Keys!,
      attempt
    );
    items.push(...additionalItems);
  }

  return items;
}

export async function batchGetAll<T extends Record<string, any>>(
  ddb: DynamoDBDocument,
  tableName: string,
  keys: Record<string, string>[]
) {
  const batches = chunk(keys, MAX_BATCH_READ_SIZE);

  const requests = batches.map(async (batch) => {
    return recursiveBatchGet(ddb, tableName, batch);
  });

  const items = await Promise.all(requests);

  const flattened = items.flat();

  return flattened as T[];
}
