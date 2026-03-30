import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AuthenticatedRequest } from "../middleware/auth";
import { HttpError } from "../utils/http";
import { assertProjectMember } from "../utils/projectAccess";

const projectIdSchema = z.object({
  projectId: z.coerce.number()
});

const createSharedFileSchema = z.object({
  originalName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(120),
  contentBase64: z.string().min(1)
});

const allowedExtensions = new Set([".pdf", ".doc", ".docx", ".ppt", ".pptx"]);
const maxFileSizeBytes = 3 * 1024 * 1024;
const uploadsRoot = process.env.SYNCUP_UPLOAD_DIR
  ? path.resolve(process.env.SYNCUP_UPLOAD_DIR)
  : path.join(process.env.APPDATA ?? os.homedir(), "SyncUp", "uploads");

const ensureUploadsRoot = async () => {
  await fs.mkdir(uploadsRoot, { recursive: true });
};

const sanitizeName = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, "_");

export const listSharedFiles = async (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = projectIdSchema.parse(req.params);
  await assertProjectMember(projectId, req.auth!.userId);

  const files = await prisma.sharedFile.findMany({
    where: { projectId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  res.json({ files });
};

export const uploadSharedFile = async (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = projectIdSchema.parse(req.params);
  const payload = createSharedFileSchema.parse(req.body);
  const userId = req.auth!.userId;
  await assertProjectMember(projectId, userId);

  const extension = path.extname(payload.originalName).toLowerCase();
  if (!allowedExtensions.has(extension)) {
    throw new HttpError(400, "Only PDF, Word, and PowerPoint files are supported.");
  }

  const buffer = Buffer.from(payload.contentBase64, "base64");
  if (!buffer.length) {
    throw new HttpError(400, "Uploaded file is empty.");
  }

  if (buffer.byteLength > maxFileSizeBytes) {
    throw new HttpError(400, "Files must be 3 MB or smaller.");
  }

  await ensureUploadsRoot();
  const storedName = `${projectId}-${randomUUID()}-${sanitizeName(payload.originalName)}`;
  const filePath = path.join(uploadsRoot, storedName);
  await fs.writeFile(filePath, buffer);

  const file = await prisma.sharedFile.create({
    data: {
      projectId,
      userId,
      originalName: payload.originalName,
      storedName,
      mimeType: payload.mimeType,
      sizeBytes: buffer.byteLength
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  res.status(201).json({ file });
};

export const downloadSharedFile = async (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = projectIdSchema.parse(req.params);
  const fileId = z.coerce.number().parse(req.params.fileId);
  await assertProjectMember(projectId, req.auth!.userId);

  const file = await prisma.sharedFile.findFirst({
    where: {
      id: fileId,
      projectId
    }
  });

  if (!file) {
    throw new HttpError(404, "File not found.");
  }

  const filePath = path.join(uploadsRoot, file.storedName);

  try {
    await fs.access(filePath);
  } catch {
    throw new HttpError(404, "Stored file is missing.");
  }

  res.download(filePath, file.originalName);
};
