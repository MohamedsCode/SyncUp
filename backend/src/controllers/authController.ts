import bcrypt from "bcrypt";
import { Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { HttpError } from "../utils/http";
import { signAuthToken } from "../utils/jwt";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const toSafeUser = (user: { id: number; name: string; email: string }) => ({
  id: user.id,
  name: user.name,
  email: user.email
});

export const register = async (req: AuthenticatedRequest, res: Response) => {
  const payload = registerSchema.parse(req.body);
  const existingUser = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });

  if (existingUser) {
    throw new HttpError(409, "An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email.toLowerCase(),
      passwordHash
    }
  });

  const token = signAuthToken({ userId: user.id, email: user.email });
  res.status(201).json({ token, user: toSafeUser(user) });
};

export const login = async (req: AuthenticatedRequest, res: Response) => {
  const payload = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({
    where: { email: payload.email.toLowerCase() }
  });

  if (!user) {
    throw new HttpError(401, "Invalid email or password.");
  }

  const validPassword = await bcrypt.compare(payload.password, user.passwordHash);
  if (!validPassword) {
    throw new HttpError(401, "Invalid email or password.");
  }

  const token = signAuthToken({ userId: user.id, email: user.email });
  res.json({ token, user: toSafeUser(user) });
};

export const me = async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
    select: {
      id: true,
      name: true,
      email: true
    }
  });

  if (!user) {
    throw new HttpError(404, "User not found.");
  }

  res.json({ user });
};
