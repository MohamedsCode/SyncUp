import bcrypt from "bcrypt";
import { TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { DERIV_PROJECT_ID, derivProjectDeadline, derivProjectMembers, derivProjectTasks } from "../data/derivProject";

const DERIV_PROJECT_CODE = "DERIV25";
const DERIV_SEED_PASSWORD = "password123";

export const seedDerivProject = async () => {
  const passwordHash = await bcrypt.hash(DERIV_SEED_PASSWORD, 10);

  const users = await Promise.all(
    derivProjectMembers.map((member) =>
      prisma.user.upsert({
        where: { email: member.email },
        update: {
          name: member.name,
          passwordHash
        },
        create: {
          id: member.id,
          name: member.name,
          email: member.email,
          passwordHash
        }
      })
    )
  );

  const project = await prisma.project.upsert({
    where: { code: DERIV_PROJECT_CODE },
    update: {
      name: "Deriv Project",
      deadline: derivProjectDeadline
    },
    create: {
      id: DERIV_PROJECT_ID,
      name: "Deriv Project",
      code: DERIV_PROJECT_CODE,
      deadline: derivProjectDeadline
    }
  });

  await Promise.all(
    users.map((user, index) =>
      prisma.projectMember.upsert({
        where: {
          userId_projectId: {
            userId: user.id,
            projectId: project.id
          }
        },
        update: {
          role: index === 0 ? "owner" : "member"
        },
        create: {
          userId: user.id,
          projectId: project.id,
          role: index === 0 ? "owner" : "member"
        }
      })
    )
  );

  const userBySeedId = new Map(derivProjectMembers.map((member, index) => [member.id, users[index].id]));

  for (const task of derivProjectTasks) {
    const savedTask = await prisma.task.upsert({
      where: { id: task.id },
      update: {
        projectId: project.id,
        title: task.title,
        description: task.description,
        deadline: task.deadline,
        status: task.status as TaskStatus,
        priority: task.priority as TaskPriority
      },
      create: {
        id: task.id,
        projectId: project.id,
        title: task.title,
        description: task.description,
        deadline: task.deadline,
        status: task.status as TaskStatus,
        priority: task.priority as TaskPriority
      }
    });

    await prisma.taskAssignment.deleteMany({
      where: { taskId: savedTask.id }
    });

    await prisma.taskAssignment.createMany({
      data: task.assignees.map((assignee) => ({
        taskId: savedTask.id,
        userId: userBySeedId.get(assignee.id) ?? assignee.id
      })),
      skipDuplicates: true
    });
  }

};
