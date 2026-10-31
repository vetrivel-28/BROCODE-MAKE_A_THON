import type { RequestHandler } from "express";
import { tokenService } from "../services/token.service.js";

export const authenticate: RequestHandler = (request, response, next) => {
  const authorization = request.get("authorization");
  const match = authorization?.match(/^Bearer ([^\s]+)$/);
  const principal = match
    ? tokenService.verifyAccessToken(match[1]!)
    : null;

  if (!principal) {
    response.status(401).json({
      error: {
        code: "UNAUTHENTICATED",
        message: "A valid access token is required",
      },
    });
    return;
  }

  request.identity = principal;
  next();
};
