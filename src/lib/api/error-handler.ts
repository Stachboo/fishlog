import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteHandler = (
  req: NextRequest,
  context?: { params: Promise<any> }
) => Promise<NextResponse>;

function logError(code: string, error: unknown): void {
  const entry = {
    timestamp: new Date().toISOString(),
    code,
    message: error instanceof Error ? error.message : String(error),
    stack:
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.stack
        : undefined,
  };
  console.error(JSON.stringify(entry));
}

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
        logError("VALIDATION_ERROR", error);
        return NextResponse.json(
          { error: message, code: "VALIDATION_ERROR" },
          { status: 400 }
        );
      }

      if (error instanceof AuthError) {
        logError("AUTH_ERROR", error);
        return NextResponse.json(
          { error: error.message, code: "AUTH_ERROR" },
          { status: 401 }
        );
      }

      if (error instanceof NotFoundError) {
        logError("NOT_FOUND", error);
        return NextResponse.json(
          { error: error.message, code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      logError("INTERNAL_ERROR", error);
      return NextResponse.json(
        { error: "Internal server error", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }
  };
}
