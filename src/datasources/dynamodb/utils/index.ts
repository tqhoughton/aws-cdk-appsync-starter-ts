export * from "./dynamodb";

export function withTimestamps() {
  const now = new Date().toISOString();
  return {
    createdAt: now,
    updatedAt: now,
  };
}
