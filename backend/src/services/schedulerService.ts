import { TaskStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { HttpError } from "../utils/http";

interface TimeInterval {
  start: number;
  end: number;
}

export interface RecommendedSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startDateTime: string;
  endDateTime: string;
  overlapMinutes: number;
  label?: string;
}

const MINIMUM_DURATION_MINUTES = 60;

const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const toTimeString = (value: number) => {
  const hours = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (value % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const intersectIntervals = (left: TimeInterval[], right: TimeInterval[]) => {
  const result: TimeInterval[] = [];

  for (const leftInterval of left) {
    for (const rightInterval of right) {
      const start = Math.max(leftInterval.start, rightInterval.start);
      const end = Math.min(leftInterval.end, rightInterval.end);

      if (end - start >= MINIMUM_DURATION_MINUTES) {
        result.push({ start, end });
      }
    }
  }

  return result;
};

const toUpcomingDate = (dayOfWeek: number, time: string) => {
  const now = new Date();
  const [hours, minutes] = time.split(":").map(Number);
  const base = new Date(now);
  const currentDay = base.getDay();
  let offset = dayOfWeek - currentDay;
  if (offset < 0 || (offset === 0 && (hours < base.getHours() || (hours === base.getHours() && minutes <= base.getMinutes())))) {
    offset += 7;
  }

  base.setDate(base.getDate() + offset);
  base.setHours(hours, minutes, 0, 0);
  return base;
};

const buildBlocks = (dayOfWeek: number, interval: TimeInterval) => {
  const blocks: RecommendedSlot[] = [];

  for (let start = interval.start; start + MINIMUM_DURATION_MINUTES <= interval.end; start += 60) {
    const end = start + MINIMUM_DURATION_MINUTES;
    const startTime = toTimeString(start);
    const endTime = toTimeString(end);
    const startDate = toUpcomingDate(dayOfWeek, startTime);
    const endDate = toUpcomingDate(dayOfWeek, endTime);

    blocks.push({
      dayOfWeek,
      startTime,
      endTime,
      startDateTime: startDate.toISOString(),
      endDateTime: endDate.toISOString(),
      overlapMinutes: interval.end - interval.start
    });
  }

  return blocks;
};

const computeUrgency = (deadlines: Date[], incompleteTasks: number, totalTasks: number) => {
  if (!totalTasks || !incompleteTasks || !deadlines.length) {
    return { score: 0, level: "low" as const };
  }

  const now = new Date();
  const nearestDeadline = deadlines.sort((a, b) => a.getTime() - b.getTime())[0];
  const rawDaysLeft = (nearestDeadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
  const daysLeft = Math.max(rawDaysLeft, 0.25);
  const incompleteRatio = incompleteTasks / totalTasks;
  const score = Number(((1 / daysLeft) * incompleteRatio).toFixed(3));

  if (score >= 0.75) {
    return { score, level: "high" as const };
  }
  if (score >= 0.35) {
    return { score, level: "medium" as const };
  }
  return { score, level: "low" as const };
};

export const getMeetingRecommendations = async (projectId: number) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: {
          user: {
            include: {
              availability: true
            }
          }
        }
      },
      tasks: {
        include: {
          assignments: true
        }
      }
    }
  });

  if (!project) {
    throw new HttpError(404, "Project not found.");
  }

  if (!project.members.length) {
    return {
      urgency: { score: 0, level: "low" as const },
      slots: []
    };
  }

  const allSlots: RecommendedSlot[] = [];

  for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek += 1) {
    const memberDayIntervals = project.members.map((member) =>
      member.user.availability
        .filter((slot) => slot.dayOfWeek === dayOfWeek)
        .map((slot) => ({
          start: toMinutes(slot.startTime),
          end: toMinutes(slot.endTime)
        }))
    );

    if (memberDayIntervals.some((intervals) => intervals.length === 0)) {
      continue;
    }

    let overlap = memberDayIntervals[0];
    for (let index = 1; index < memberDayIntervals.length; index += 1) {
      overlap = intersectIntervals(overlap, memberDayIntervals[index]);
      if (!overlap.length) {
        break;
      }
    }

    for (const interval of overlap) {
      allSlots.push(...buildBlocks(dayOfWeek, interval));
    }
  }

  const incompleteTasks = project.tasks.filter((task) => task.status !== TaskStatus.done);
  const urgency = computeUrgency(
    incompleteTasks.map((task) => task.deadline),
    incompleteTasks.length,
    project.tasks.length
  );

  const sortedSlots = [...allSlots].sort((left, right) => {
    const leftStart = new Date(left.startDateTime).getTime();
    const rightStart = new Date(right.startDateTime).getTime();

    if (urgency.level === "high") {
      return leftStart - rightStart || right.overlapMinutes - left.overlapMinutes;
    }

    if (urgency.level === "medium") {
      const leftScore = leftStart / (1000 * 60 * 60) - left.overlapMinutes / 30;
      const rightScore = rightStart / (1000 * 60 * 60) - right.overlapMinutes / 30;
      return leftScore - rightScore;
    }

    return right.overlapMinutes - left.overlapMinutes || leftStart - rightStart;
  });

  const topSlots = sortedSlots.slice(0, 3).map((slot, index) => ({
    ...slot,
    label: index === 0 ? "🔥 Recommended based on urgency" : undefined
  }));

  return {
    urgency,
    slots: topSlots
  };
};
