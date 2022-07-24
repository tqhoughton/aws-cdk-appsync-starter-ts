import {
  AmplifyAppSyncSimulator,
  AmplifyAppSyncSimulatorAuthenticationType,
  AmplifyAppSyncSimulatorConfig,
} from "amplify-appsync-simulator";

import fs from "fs";
import path from "path";
import request from "supertest";

const publicSchemaContent = fs
  .readFileSync(path.join(__dirname, "../../build/public.graphql"))
  .toString()
  .replace("scalar AWSDateTime", "")
  .replace("scalar AWSURL", "");

const publicApibaseConfig: AmplifyAppSyncSimulatorConfig = {
  appSync: {
    defaultAuthenticationType: {
      authenticationType: AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
    },
    name: "test",
    apiKey: "fake-api-key",
    additionalAuthenticationProviders: [],
  },
  schema: { content: publicSchemaContent },
};

export async function createPublicApi(
  dataSources: AmplifyAppSyncSimulatorConfig["dataSources"],
  resolvers: AmplifyAppSyncSimulatorConfig["resolvers"]
): Promise<{ api: AmplifyAppSyncSimulator; port: number }> {
  const port = 3000 + +process.env.JEST_WORKER_ID! * 2;

  const graphQLApiSimulator = new AmplifyAppSyncSimulator({
    port: port,
    wsPort: port + 1,
  });

  await graphQLApiSimulator.start();
  await graphQLApiSimulator.init({
    ...publicApibaseConfig,
    dataSources,
    resolvers,
  });

  return { api: graphQLApiSimulator, port };
}

export async function makeRequest(
  port: number,
  query: string,
  variables: Record<string, any>
) {
  const data = JSON.stringify({
    query,
    variables,
  });

  const response = await request(`http://localhost:${port}`)
    .post("/graphql")
    .set("x-api-key", "fake-api-key")
    .set("Content-Type", "application/json")
    .send(data);

  if (response.body.errors) {
    console.error(JSON.stringify(response.body.errors));
  }

  return response.body.data;
}
