import { getDocumentClient } from "src/datasources/dynamodb/utils/dynamodb";
import {
  Mutation,
  MutationCreateOrganizationArgs,
} from "graphql/private/types.generated";
import { getEnvironmentVariable } from "src/utils/env";
import { AppSyncResolverEventWithCognitoAuth } from "src/utils/types";
import { OrganizationDatasource } from "src/datasources/dynamodb";
import { createLogger } from "src/utils/logger";

const documentClient = getDocumentClient();
const orgsTable = getEnvironmentVariable("ORG_TABLE");

const organizations = new OrganizationDatasource(orgsTable, documentClient);
const logger = createLogger("mutation", "createOrganization");

export async function handler(
  event: AppSyncResolverEventWithCognitoAuth<MutationCreateOrganizationArgs>
): Promise<Mutation["createOrganization"]> {
  logger.info({ event });

  const { input } = event.arguments;

  const userId = event.identity.sub;
  const members: Set<string> = new Set(input.members);

  const org = await organizations.create({
    name: input.name,
    owner: userId,
    members,
  });

  return {
    organization: {
      ...org,
      // convert from Set to Array
      members: [...org.members],
    },
  };
}
