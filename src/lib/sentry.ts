import * as Sentry from "@sentry/nextjs";
import { logger } from "./logger";

type CaptureContext = {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: { id?: string; email?: string };
};

export function captureException(error: unknown, ctx?: CaptureContext) {
  const message = error instanceof Error ? error.message : String(error);
  logger.error("exception", {
    message,
    stack: error instanceof Error ? error.stack : undefined,
    ...ctx,
  });

  Sentry.withScope((scope) => {
    if (ctx?.tags) scope.setTags(ctx.tags);
    if (ctx?.extra) scope.setExtras(ctx.extra);
    if (ctx?.user) scope.setUser(ctx.user);
    Sentry.captureException(error);
  });
}

export function captureMessage(message: string, ctx?: CaptureContext) {
  logger.warn(message, ctx);

  Sentry.withScope((scope) => {
    scope.setLevel("warning");
    if (ctx?.tags) scope.setTags(ctx.tags);
    if (ctx?.extra) scope.setExtras(ctx.extra);
    if (ctx?.user) scope.setUser(ctx.user);
    Sentry.captureMessage(message);
  });
}
