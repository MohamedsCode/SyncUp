import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthTokenPayload {
  userId: number;
  email: string;
}

export const signAuthToken = (payload: AuthTokenPayload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });

export const verifyAuthToken = (token: string) =>
  jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
