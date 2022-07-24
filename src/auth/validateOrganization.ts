import { AppSyncResolverEvent } from "aws-lambda";
import { Organization } from "graphql/private/types.generated";
import { getDocumentClient } from "src/datasources/dynamodb/utils/dynamodb";
import { getEnvironmentVariable } from "src/utils/env";
import { createLogger } from "src/utils/logger";

const documentClient = getDocumentClient();
const orgsTable = getEnvironmentVariable("ORG_TABLE");

class UnauthorizedError extends Error {
  public type: string;

  constructor(message: string = "Unauthorized") {
    super(message);
    this.type = "AuthorizationError";
  }
}

const logger = createLogger("validateOrganization");

export async function handler(event: AppSyncResolverEvent<null>): Promise<any> {
  logger.info({ event });
  const { organizationId, userId } = event.stash;

  const response = await documentClient.get({
    TableName: orgsTable,
    Key: {
      id: organizationId,
    },
  });

  const organization = response.Item as Organization | undefined;

  if (!organization) {
    throw new UnauthorizedError();
  }

  const isMember =
    organization.members && [...organization.members].includes(userId);
  const isOwner = organization.owner === userId;

  if (!isOwner && !isMember) {
    throw new UnauthorizedError();
  }

  return {
    isMember,
    isOwner,
    organization,
  };
}
