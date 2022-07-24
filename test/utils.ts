import request from "supertest";

// Templates that are equivalent to the direct Lambda resolver behavior,
// based on what we've seen with deployed direct Lambda resolvers.
export const directLambdaRequestTemplate = `## Direct lambda request
{
  "version": "2018-05-29",
  "operation": "Invoke",
  "payload": $utils.toJson($context)
}`;

export const directLambdaBatchRequestTemplate = `## Direct lambda request
{
  "version": "2018-05-29",
  "operation": "BatchInvoke",
  "payload": $utils.toJson($context)
}`;

export const directLambdaResponseTemplate = `## Direct lambda response
#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type, $ctx.result)
#end
$util.toJson($ctx.result)`;
