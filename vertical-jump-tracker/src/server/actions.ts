"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentWeek } from "@/lib/program";
import type { ReadinessLog, SessionLog, TestEntry } from "@/lib/types";
import { addReadinessLog, addTestEntry, upsertSessionLog } from "@/server/store";

const optionalNumber = (formData: FormData, key: string) => {
  const raw = formData.get(key);
  if (raw === null || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

const boundedOptional = (min: number, max: number) => z.number().min(min).max(max).nullable();

const sessionSchema = z.object({
  sessionId: z.string().min(1),
  completed: z.boolean(),
  actualLoadOrTouch: z.string(),
  rpe: boundedOptional(1, 10),
  knee24h: boundedOptional(0, 10),
  notes: z.string(),
});

export async function saveSessionLog(formData: FormData) {
  const parsed = sessionSchema.parse({
    sessionId: formData.get("sessionId"),
    completed: formData.get("completed") === "on",
    actualLoadOrTouch: String(formData.get("actualLoadOrTouch") ?? ""),
    rpe: optionalNumber(formData, "rpe"),
    knee24h: optionalNumber(formData, "knee24h"),
    notes: String(formData.get("notes") ?? ""),
  });
  const log: SessionLog = {
    ...parsed,
    updatedAt: new Date().toISOString(),
  };
  await upsertSessionLog(log);
  revalidatePath("/");
}

const readinessSchema = z.object({
  date: z.string().min(1),
  bodyweight: z.number().positive().nullable(),
  sleepQuality: boundedOptional(1, 5),
  kneeAmPain: boundedOptional(0, 10),
  knee24hPain: boundedOptional(0, 10),
  achillesStiffness: boundedOptional(0, 10),
  bjjIntensity: boundedOptional(0, 10),
  sessionRpe: boundedOptional(1, 10),
  jumpContacts: z.number().int().min(0).nullable(),
  sprintReps: z.number().int().min(0).nullable(),
  notes: z.string(),
});

export async function createReadinessLog(formData: FormData) {
  const parsed = readinessSchema.parse({
    date: formData.get("date"),
    bodyweight: optionalNumber(formData, "bodyweight"),
    sleepQuality: optionalNumber(formData, "sleepQuality"),
    kneeAmPain: optionalNumber(formData, "kneeAmPain"),
    knee24hPain: optionalNumber(formData, "knee24hPain"),
    achillesStiffness: optionalNumber(formData, "achillesStiffness"),
    bjjIntensity: optionalNumber(formData, "bjjIntensity"),
    sessionRpe: optionalNumber(formData, "sessionRpe"),
    jumpContacts: optionalNumber(formData, "jumpContacts"),
    sprintReps: optionalNumber(formData, "sprintReps"),
    notes: String(formData.get("notes") ?? ""),
  });
  const log: ReadinessLog = {
    ...parsed,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  await addReadinessLog(log);
  revalidatePath("/");
}

const testSchema = z.object({
  date: z.string().min(1),
  standingReach: z.number().positive(),
  maxTouch: z.number().positive().nullable(),
  bestHoopHeight: z.number().positive().nullable(),
  ballType: z.string(),
  makes: z.number().int().min(0).nullable(),
  attempts: z.number().int().min(0).nullable(),
  knee24h: boundedOptional(0, 10),
  notes: z.string(),
});

export async function createTestEntry(formData: FormData) {
  const date = String(formData.get("date") ?? "");
  const parsed = testSchema.parse({
    date,
    standingReach: optionalNumber(formData, "standingReach") ?? 89,
    maxTouch: optionalNumber(formData, "maxTouch"),
    bestHoopHeight: optionalNumber(formData, "bestHoopHeight"),
    ballType: String(formData.get("ballType") ?? "Tennis ball"),
    makes: optionalNumber(formData, "makes"),
    attempts: optionalNumber(formData, "attempts"),
    knee24h: optionalNumber(formData, "knee24h"),
    notes: String(formData.get("notes") ?? ""),
  });
  const entry: TestEntry = {
    ...parsed,
    id: crypto.randomUUID(),
    week: getCurrentWeek(new Date(`${date}T00:00:00`)),
    createdAt: new Date().toISOString(),
  };
  await addTestEntry(entry);
  revalidatePath("/");
}
