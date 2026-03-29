import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

const envCandidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../.env"),
  path.resolve(path.dirname(process.execPath), ".env"),
  (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath
    ? path.resolve((process as NodeJS.Process & { resourcesPath?: string }).resourcesPath!, ".env")
    : null,
  (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath
    ? path.resolve((process as NodeJS.Process & { resourcesPath?: string }).resourcesPath!, "database", "prisma", ".env")
    : null
].filter(Boolean) as string[];

for (const envPath of envCandidates) {
  dotenv.config({ path: envPath, override: false });
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(8, "JWT_SECRET must be at least 8 characters"),
  FRONTEND_URL: z.string().default("http://localhost:5173")
});

export const env = envSchema.parse(process.env);
