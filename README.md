# AWS CDK AppSync Typescript Starter

This is an opinionated starter template for developing AWS AppSync APIs using the AWS CDK.

This CDK project deploys the following resources:

1. A public AppSync API that is authenticated via API Key
2. A private AppSync API that is authenticated via Cognito User Pools
3. Example DynamoDB tables to demonstrate how to create resolvers that access them

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Prerequisites

1. Install Docker or Docker Desktop to be able to run `npm run deploy` or `cdk synth`
2. Make sure you have a Java runtime installed to be able to run DynamoDB locally from the tests using `@shelf/jest-dynamodb`.

## Getting started

1. Run `npm install`
2. If you want to run the unit tests, run `cd test && npm install`
3. Run tests with `npm run test`
4. Deploy with `npm run deploy` (assuming you've configured the CDK and ran `cdk bootstrap`)

## Project Structure

- `bin` and `lib` - AWS CDK folders used to deploy your cloud infrastructure
- `graphql` - defines your AppSync API GraphQL Schema
- `src` - defines any Lambda function code needed to support your resolvers
- `test` - tests your AppSync API using `amplify-appsync-simulator`
- `utils` - utils for making testing the deployed APIs easier.

## How to use this project

1. Add new GraphQL types to the corresponding directory in `/graphql`
2. Add new resolver and datasource config to `lib/appsync-api-stack.ts`
3. Add new Lambda function definitions (if needed) to `src`
4. Add tests for the new resolvers in `test`
5. Commit your changes to automatically run `prettify` on all committed files

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `npm run deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template
- `npm run gql:codegen` creates Typescript types for all of your Typescript Lambda Functions to use using the `@graphql-codegen/cli` package
- `npm run gql:compile` compiles all of your GraphQL schema defined in `/graphql` into your public and private API schemas

## Testing

This project utilizes `amplify-appsync-simulator` to simulate your AppSync APIs to test against locally using `jest` and `supertest` to run the tests.

There is currently an issue with `amplify-appsync-simulator` that prevents you from installing it alongside other projects that depend on `graphql`, issue created here: https://github.com/aws-amplify/amplify-category-api/issues/692

As a workaround, the `test` folder has its own npm project, however the only dependency is `aws-appsync-simulator`. You should keep it this way unless you run into similar issues with other dependencies.

## Notes

1. There are a few GraphQL types that do not have resolvers implemented for them, they exist to show that you can deploy both public and private schemas that share certain elements but each have their own unique additions.
2. The GraphQL queries in this project have tests defined, but the mutations do not. Will be added at some point in the near future though.
3. If you do not need a public and private API, you are free to delete all references to the one you don't need and base your template off of that.
4. There is no CI/CD configuration (yet). The project is set up to assume you are using the AWS CDK to deploy from your local environment.
5. The `amplify-appsync-simulator` library used to simulate appsync is noticeably slow. From testing on a WSL2 Ubuntu distribution the tests can take anywhere from 90 to 120 seconds to complete, you may have better luck on more powerful systems.

## I want to help make this template better!

Feel free to submit PRs that either implement resolvers that have not been completed, or make the development process easier in some way. One thing that would be nice is a way to generate the test resolver config based on what has already been defined in the CDK stack, however this is not a trivial task since the primary way to expose CDK resources outside of the stack is to synthesize a cloudformation stack and export values from that.
