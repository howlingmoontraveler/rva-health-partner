import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ReadinessLog, SessionLog, TestEntry, TrackerState } from "@/lib/types";

const initialState: TrackerState = {
  sessionLogs: {},
  readinessLogs: [],
  testEntries: [
    {
      id: "baseline",
      date: "2026-05-11",
      week: 1,
      standingReach: 89,
      maxTouch: 116,
      bestHoopHeight: null,
      ballType: "None",
      makes: null,
      attempts: null,
      knee24h: null,
      notes: "Baseline estimate from intake: 89 inch standing reach and roughly 115-116 inch touch.",
      createdAt: "2026-05-11T00:00:00.000Z",
    },
  ],
};

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "tracker-state.json");
const kvUrl = process.env.KV_REST_API_URL;
const kvToken = process.env.KV_REST_API_TOKEN;
const kvKey = process.env.VERTICAL_JUMP_KV_KEY ?? "vertical-jump-tracker:state";

async function kvCommand<T>(command: unknown[]): Promise<T | null> {
  if (!kvUrl || !kvToken) return null;
  const response = await fetch(`${kvUrl}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${kvToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([command]),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`KV request failed: ${response.status} ${await response.text()}`);
  }
  const [result] = (await response.json()) as Array<{ result: T | null }>;
  return result?.result ?? null;
}

async function readLocalState(): Promise<TrackerState> {
  try {
    return JSON.parse(await readFile(dataFile, "utf8")) as TrackerState;
  } catch {
    return initialState;
  }
}

async function writeLocalState(state: TrackerState) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(state, null, 2));
}

export async function getTrackerState(): Promise<TrackerState> {
  const remote = await kvCommand<string>(["GET", kvKey]);
  if (remote) return JSON.parse(remote) as TrackerState;
  return readLocalState();
}

async function saveTrackerState(state: TrackerState) {
  if (kvUrl && kvToken) {
    await kvCommand(["SET", kvKey, JSON.stringify(state)]);
    return;
  }
  await writeLocalState(state);
}

export async function upsertSessionLog(log: SessionLog) {
  const state = await getTrackerState();
  const next: TrackerState = {
    ...state,
    sessionLogs: {
      ...state.sessionLogs,
      [log.sessionId]: log,
    },
  };
  await saveTrackerState(next);
}

export async function addReadinessLog(log: ReadinessLog) {
  const state = await getTrackerState();
  await saveTrackerState({
    ...state,
    readinessLogs: [log, ...state.readinessLogs].slice(0, 500),
  });
}

export async function addTestEntry(entry: TestEntry) {
  const state = await getTrackerState();
  await saveTrackerState({
    ...state,
    testEntries: [entry, ...state.testEntries].slice(0, 200),
  });
}
