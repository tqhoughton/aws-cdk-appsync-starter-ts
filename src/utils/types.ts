import { AppSyncResolverEvent, AppSyncIdentityCognito } from "aws-lambda";

export type AppSyncResolverEventWithCognitoAuth<
  TArguments,
  TSource = Record<string, any>
> = AppSyncResolverEvent<TArguments, TSource> & {
  identity: AppSyncIdentityCognito;
};
