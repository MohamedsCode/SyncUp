import { Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AuthenticatedRequest } from "../middleware/auth";

const availabilitySchema = z.object({
  slots: z.array(
    z.object({
      dayOfWeek: z.number().min(0).max(6),
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      endTime: z.string().regex(/^\d{2}:\d{2}$/)
    })
  )
});

export const getAvailability = async (req: AuthenticatedRequest, res: Response) => {
  const availability = await prisma.availability.findMany({
    where: {
      userId: req.auth!.userId
    },
    orderBy: [
      { dayOfWeek: "asc" },
      { startTime: "asc" }
    ]
  });

  res.json({ availability });
};

export const saveAvailability = async (req: AuthenticatedRequest, res: Response) => {
  const payload = availabilitySchema.parse(req.body);

  const availability = await prisma.$transaction(async (transaction) => {
    await transaction.availability.deleteMany({
      where: {
        userId: req.auth!.userId
      }
    });

    if (!payload.slots.length) {
      return [];
    }

    await transaction.availability.createMany({
      data: payload.slots.map((slot) => ({
        userId: req.auth!.userId,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime
      }))
    });

    return transaction.availability.findMany({
      where: {
        userId: req.auth!.userId
      },
      orderBy: [
        { dayOfWeek: "asc" },
        { startTime: "asc" }
      ]
    });
  });

  res.json({ availability });
};
