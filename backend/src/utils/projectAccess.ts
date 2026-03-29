import { prisma } from "../config/prisma";
import { HttpError } from "./http";

export const assertProjectMember = async (projectId: number, userId: number) => {
  const membership = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId
      }
    }
  });

  if (!membership) {
    throw new HttpError(403, "You are not a member of this project.");
  }

  return membership;
};
