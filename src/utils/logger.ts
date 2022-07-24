import * as winston from "winston";

export function createLogger(
  parentType: string,
  fieldName?: string
): winston.Logger {
  return winston.createLogger({
    format: winston.format.json(),
    defaultMeta: { parentType, fieldName },
    transports: [
      new winston.transports.Console({
        // make logging silent if in unit tests and ENABLE_LOGGING isn't set
        silent: !!(process.env.JEST_WORKER_ID && !process.env.ENABLE_LOGGING),
      }),
    ],
  });
}
