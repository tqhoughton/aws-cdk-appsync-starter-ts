import {
  AmplifyAppSyncSimulator,
  AmplifyAppSyncSimulatorAuthenticationType,
  AmplifyAppSyncSimulatorConfig,
} from "amplify-appsync-simulator";

import fs from "fs";
import path from "path";
import request from "supertest";
import jwt from "jsonwebtoken";

const privateSchemaContent = fs
  .readFileSync(path.join(__dirname, "../../build/private.graphql"))
  .toString()
  .replace("scalar AWSDateTime", "")
  .replace("scalar AWSURL", "");

const privateApiBaseConfig: AmplifyAppSyncSimulatorConfig = {
  appSync: {
    defaultAuthenticationType: {
      authenticationType:
        AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
      cognitoUserPoolConfig: {},
    },
    name: "test",
    additionalAuthenticationProviders: [],
  },
  schema: { content: privateSchemaContent },
};

export async function createPrivateApi(
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
    ...privateApiBaseConfig,
    dataSources,
    resolvers,
  });

  return { api: graphQLApiSimulator, port };
}

export function getMockToken(userId: string) {
  const fakeToken = {
    sub: userId,
    email_verified: true,
    iss: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_KAEc1giUu",
    "cognito:username": userId,
    origin_jti: "6722c6fa-5a09-46e5-89d8-8c8f2d27ae74",
    aud: "3ggfp003rgp7qdchklv5jkf66c",
    event_id: "0ddac546-95ad-44c6-a1e6-8be2cf16be03",
    token_use: "id",
    auth_time: Math.floor(Date.now() / 1000),
    exp: Math.floor((Date.now() + 60 * 60 * 1000) / 1000),
    iat: Math.floor(Date.now() / 1000),
    jti: "f8c90bb0-9565-4000-9e75-927eb3f6f0a0",
    email: "test@test.com",
  };

  const encodedToken = jwt.sign(fakeToken, "BOGUS_KEY");

  return encodedToken;
}

export async function makeRequest(
  port: number,
  query: string,
  variables: Record<string, any>,
  token: string
) {
  const data = JSON.stringify({
    query,
    variables,
  });

  const response = await request(`http://localhost:${port}`)
    .post("/graphql")
    .set("Authorization", token)
    .set("Content-Type", "application/json")
    .send(data);

  return response.body.data;
}
