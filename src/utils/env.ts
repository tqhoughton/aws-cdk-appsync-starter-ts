import assert from "assert";

export interface Env {
  MENU_TABLE: string;
  MENU_ITEM_TABLE: string;
  ORG_TABLE: string;
}

export function getEnvironmentVariable(variableName: keyof Env) {
  const variable = process.env[variableName];
  assert(variable, `ERROR: missing environment variable "${variableName}"`);

  return variable;
}
