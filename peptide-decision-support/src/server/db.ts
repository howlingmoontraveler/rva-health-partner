import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AssessmentRecord, AssessmentStatus } from "@/lib/types/assessment";

const dataDir =
  process.env.ASSESSMENT_DATA_DIR ??
  (process.env.VERCEL ? path.join("/tmp", "peptide-decision-support") : path.join(process.cwd(), "data"));
const dataFile = path.join(dataDir, "assessments.json");

async function readRecords(): Promise<AssessmentRecord[]> {
  try {
    const data = await readFile(dataFile, "utf8");
    return JSON.parse(data) as AssessmentRecord[];
  } catch {
    return [];
  }
}

async function writeRecords(records: AssessmentRecord[]) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(records, null, 2));
}

export async function listAssessments() {
  const records = await readRecords();
  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAssessment(id: string) {
  const records = await readRecords();
  return records.find((record) => record.id === id) ?? null;
}

export async function saveAssessment(record: AssessmentRecord) {
  const records = await readRecords();
  const next = [record, ...records.filter((item) => item.id !== record.id)];
  await writeRecords(next);
  return record;
}

export async function updateAssessmentStatus(id: string, status: AssessmentStatus) {
  const records = await readRecords();
  const next = records.map((record) =>
    record.id === id ? { ...record, status, updatedAt: new Date().toISOString() } : record
  );
  await writeRecords(next);
}
