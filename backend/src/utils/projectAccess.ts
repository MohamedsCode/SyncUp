import { prisma } from "../config/prisma";
import { isDerivProjectId } from "../data/derivProject";
import { HttpError } from "./http";

export const assertProjectMember = async (projectId: number, userId: number) => {
  if (isDerivProjectId(projectId)) {
    return {
      userId,
      projectId,
      role: "member",
      joinedAt: new Date()
    };
  }

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
