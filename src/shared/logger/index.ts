import pino, { type LoggerOptions } from "pino";
import { env } from "../../config/env";

const options: LoggerOptions = {
  level: env.LOG_LEVEL,
  ...(env.NODE_ENV !== "production" && {
    transport: { target: "pino-pretty", options: { colorize: true } },
  }),
};

export const logger = pino(options);
