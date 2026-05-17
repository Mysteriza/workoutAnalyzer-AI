type LogLevel = "info" | "warn" | "error" | "debug";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) || "info";

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function log(level: LogLevel, context: string, message: string, data?: unknown) {
  if (!shouldLog(level)) return;

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context}]`;

  if (data !== undefined) {
    const dataStr = typeof data === "object" ? JSON.stringify(data, null, 0) : String(data);
    console[level === "error" ? "error" : "log"](`${prefix} ${message}`, dataStr);
  } else {
    console[level === "error" ? "error" : "log"](`${prefix} ${message}`);
  }
}

export const logger = {
  info: (ctx: string, msg: string, data?: unknown) => log("info", ctx, msg, data),
  warn: (ctx: string, msg: string, data?: unknown) => log("warn", ctx, msg, data),
  error: (ctx: string, msg: string, data?: unknown) => log("error", ctx, msg, data),
  debug: (ctx: string, msg: string, data?: unknown) => log("debug", ctx, msg, data),
};
