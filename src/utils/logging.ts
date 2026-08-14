type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = (process.env.LOG_LEVEL as LogLevel) ?? "info";

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[currentLevel];
}

function formatMessage(level: LogLevel, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

export const logger = {
  debug(message: string) {
    if (shouldLog("debug")) console.error(formatMessage("debug", message));
  },
  info(message: string) {
    if (shouldLog("info")) console.error(formatMessage("info", message));
  },
  warn(message: string) {
    if (shouldLog("warn")) console.error(formatMessage("warn", message));
  },
  error(message: string) {
    if (shouldLog("error")) console.error(formatMessage("error", message));
  },
};