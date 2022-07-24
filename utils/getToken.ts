import { Auth } from "@aws-amplify/auth";
import yargs from "yargs";
import fs from "fs";
import path from "path";

const argv = yargs
  .option("userPoolId", {
    alias: "u",
    type: "string",
    description: "Cognito User Pool Id",
  })
  .option("appClientId", {
    alias: "a",
    type: "string",
    description: "Cognito Web App Client Id",
  })
  .option("username", {
    type: "string",
    description: "email address of the user to create",
  })
  .option("password", {
    alias: "p",
    type: "string",
    description: "password of the user",
  })
  .option("region", {
    alias: "r",
    type: "string",
    description: "AWS Region to create the user in",
  })
  .option("idTokenOutput", {
    alias: "o",
    type: "string",
    default: "idToken",
    description: "Where to write the token output to",
  })
  .option("accessTokenOutput", {
    type: "string",
    default: "accessToken",
    description: "Where to write the token output to",
  }).argv;

const {
  userPoolId,
  appClientId,
  username,
  password,
  region,
  idTokenOutput,
  accessTokenOutput,
} = argv;

Auth.configure({
  userPoolId: userPoolId,
  userPoolWebClientId: appClientId,
  region,
});

(async () => {
  const user = await Auth.signIn({ username: username!, password: password! });
  const idToken = user.signInUserSession.idToken.jwtToken;
  const accessToken = user.signInUserSession.accessToken.jwtToken;
  fs.writeFileSync(
    path.resolve(__dirname, `../${idTokenOutput}.token`),
    idToken
  );
  fs.writeFileSync(
    path.resolve(__dirname, `../${accessTokenOutput}.token`),
    accessToken
  );
})().catch((error) => console.error(error));
