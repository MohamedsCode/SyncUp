import { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../utils/jwt";
import { HttpError } from "../utils/http";

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: number;
    email: string;
  };
}

export const requireAuth = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  if (!token) {
    return next(new HttpError(401, "Authentication required."));
  }

  try {
    const payload = verifyAuthToken(token);
    req.auth = { userId: payload.userId, email: payload.email };
    return next();
  } catch {
    return next(new HttpError(401, "Invalid or expired token."));
  }
};
