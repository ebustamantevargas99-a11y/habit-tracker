type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL = (process.env.LOG_LEVEL as LogLevel) ?? "info";
const IS_PROD = process.env.NODE_ENV === "production";

type LogContext = Record<string, unknown>;

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[MIN_LEVEL];
}

function sanitize(ctx: LogContext | undefined): LogContext | undefined {
  if (!ctx) return ctx;
  const clone: LogContext = {};
  for (const [k, v] of Object.entries(ctx)) {
    if (/pass|secret|token|authorization|cookie|api[_-]?key/i.test(k)) {
      clone[k] = "[REDACTED]";
      continue;
    }
    clone[k] = v instanceof Error ? { name: v.name, message: v.message } : v;
  }
  return clone;
}

function emit(level: LogLevel, message: string, ctx?: LogContext) {
  if (!shouldLog(level)) return;
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(sanitize(ctx) ?? {}),
  };
  const line = IS_PROD ? JSON.stringify(payload) : `[${level}] ${message}`;
  const ctxStr =
    !IS_PROD && ctx ? " " + JSON.stringify(sanitize(ctx)) : "";
  if (level === "error" || level === "warn") {
    console.error(line + ctxStr);
  } else {
    console.log(line + ctxStr);
  }
}

export const logger = {
  debug: (message: string, ctx?: LogContext) => emit("debug", message, ctx),
  info: (message: string, ctx?: LogContext) => emit("info", message, ctx),
  warn: (message: string, ctx?: LogContext) => emit("warn", message, ctx),
  error: (message: string, ctx?: LogContext) => emit("error", message, ctx),
};
