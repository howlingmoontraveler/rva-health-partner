import { inflateSync } from "node:zlib";
import { bloodworkFieldByKey } from "@/lib/data/functionalBloodwork";
import type { ExtractedLabValue, LabUploadSummary } from "@/lib/types/assessment";

type LabPattern = {
  key: string;
  aliases: string[];
  min: number;
  max: number;
  rejectLineIncludes?: string[];
};

type Candidate = ExtractedLabValue & {
  score: number;
};

export type ParsedLabUpload = {
  values: Record<string, number>;
  summary: LabUploadSummary | null;
};

type TextExtraction = {
  method: LabUploadSummary["extractionMethod"];
  text: string;
  warnings?: string[];
};

const maxUploadBytes = 8 * 1024 * 1024;

const labPatterns: LabPattern[] = [
  { key: "fasting_glucose", aliases: ["fasting glucose", "glucose, serum", "glucose"], min: 20, max: 500 },
  { key: "fasting_insulin", aliases: ["fasting insulin", "insulin"], min: 0.1, max: 300 },
  { key: "hba1c", aliases: ["hemoglobin a1c", "hb a1c", "hba1c", "a1c"], min: 3, max: 16 },
  { key: "triglycerides", aliases: ["triglycerides", "triglyceride"], min: 10, max: 3000 },
  { key: "hdl", aliases: ["hdl cholesterol", "hdl-c", "hdl"], min: 5, max: 180, rejectLineIncludes: ["ratio"] },
  { key: "ldl", aliases: ["ldl cholesterol", "ldl-c", "ldl calculated", "ldl calc", "ldl"], min: 10, max: 500, rejectLineIncludes: ["ratio", "vldl"] },
  { key: "apob", aliases: ["apolipoprotein b", "apo b", "apob"], min: 20, max: 300 },
  { key: "hs_crp", aliases: ["hs-crp", "hs crp", "c-reactive protein, cardiac", "cardiac crp", "high sensitivity crp", "high-sensitivity crp", "crp, high sensitivity"], min: 0.05, max: 300 },
  { key: "alt", aliases: ["alanine aminotransferase", "alt (sgpt)", "alt"], min: 1, max: 3000 },
  { key: "ast", aliases: ["aspartate aminotransferase", "ast (sgot)", "ast"], min: 1, max: 3000 },
  { key: "egfr", aliases: ["estimated glomerular filtration rate", "egfr", "gfr"], min: 1, max: 200 },
  { key: "tsh", aliases: ["thyroid stimulating hormone", "tsh"], min: 0.01, max: 150 },
  { key: "free_t4", aliases: ["free t4", "t4, free", "thyroxine free"], min: 0.1, max: 12 },
  {
    key: "vitamin_d",
    aliases: [
      "25-hydroxy vitamin d",
      "25 hydroxy vitamin d",
      "25-hydroxyvitamin d",
      "25 hydroxyvitamin d",
      "25(oh) vitamin d",
      "25 oh vitamin d",
      "25-oh vitamin d",
      "vitamin d, 25-hydroxy",
      "vitamin d 25-hydroxy",
      "vitamin d 25 hydroxy",
      "vitamin d"
    ],
    min: 1,
    max: 250
  },
  { key: "b12", aliases: ["vitamin b12", "b-12", "b12"], min: 50, max: 4000 },
  { key: "folate", aliases: ["folate", "folic acid"], min: 0.5, max: 150 },
  { key: "ferritin", aliases: ["ferritin"], min: 1, max: 10000 },
  { key: "homocysteine", aliases: ["homocysteine"], min: 1, max: 300 }
];

function normalizeText(text: string) {
  return text
    .replace(/\u0000/g, " ")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function aliasRegex(alias: string) {
  const body = escapeRegExp(alias)
    .replace(/\\\s+/g, "\\s+")
    .replace(/\\-/g, "[-\\s]?")
    .replace(/\\,/g, "\\s*,?\\s*");
  return new RegExp(`(^|[^a-z0-9])(${body})([^a-z0-9]|$)`, "i");
}

function parseNumber(raw: string) {
  const value = Number(raw.replaceAll(",", ""));
  return Number.isFinite(value) ? value : null;
}

function confidenceFromScore(score: number): ExtractedLabValue["confidence"] {
  if (score >= 8) return "high";
  if (score >= 5) return "moderate";
  return "low";
}

function unitVariants(unit: string) {
  const normalized = unit.toLowerCase().replace(/[µμ]/g, "u").replace(/\s+/g, "");
  const variants = new Set([unit.toLowerCase(), normalized]);
  if (unit === "%") {
    variants.add("%");
    variants.add("percent");
  }
  if (normalized === "uiu/ml") {
    variants.add("uiu/ml");
    variants.add("uiu / ml");
    variants.add("u iu/ml");
    variants.add("miu/l");
  }
  if (normalized === "ml/min/1.73m2") {
    variants.add("ml/min/1.73");
    variants.add("ml/min/1.73m2");
    variants.add("ml/min/1.73 m2");
  }
  return [...variants];
}

type NumberToken = {
  raw: string;
  value: number;
  start: number;
  end: number;
};

function numberTokens(text: string) {
  const tokens: NumberToken[] = [];
  for (const match of text.matchAll(/[<>≤≥]?\s*-?\d[\d,]*(?:\.\d+)?/g)) {
    if (match.index === undefined) continue;
    const raw = match[0];
    const value = parseNumber(raw.replace(/[<>≤≥]/g, "").trim());
    if (value === null) continue;
    tokens.push({ raw, value, start: match.index, end: match.index + raw.length });
  }
  return tokens;
}

function isDateLike(text: string, token: NumberToken) {
  const before = text.slice(Math.max(0, token.start - 8), token.start);
  const after = text.slice(token.end, token.end + 8);
  return /\/\s*$/.test(before) || /^\s*\//.test(after) || /\b(date|collected|reported|dob)\b/i.test(before + after);
}

function isReferenceRangePart(text: string, token: NumberToken) {
  const before = text.slice(Math.max(0, token.start - 16), token.start).toLowerCase();
  const after = text.slice(token.end, token.end + 16).toLowerCase();
  return /[-–—]\s*$/.test(before) || /^\s*[-–—]/.test(after) || /\b(to|through|thru)\s*$/.test(before) || /^\s*(to|through|thru)\b/.test(after);
}

function hasReferenceContext(text: string, token: NumberToken) {
  const context = text.slice(Math.max(0, token.start - 42), Math.min(text.length, token.end + 42)).toLowerCase();
  return /\b(ref(?:erence)?|interval|range|normal|expected|desired|optimal)\b/.test(context);
}

function hasResultContext(text: string, token: NumberToken) {
  const context = text.slice(Math.max(0, token.start - 32), Math.min(text.length, token.end + 20)).toLowerCase();
  return /\b(result|current|value|actual|final)\b/.test(context);
}

function hasFlagContext(text: string, token: NumberToken) {
  const context = text.slice(token.end, Math.min(text.length, token.end + 18)).toLowerCase();
  return /(^|\s)(h|l|high|low|abnormal|flag)(\s|$)/.test(context);
}

function hasUnitContext(unit: string, text: string, token: NumberToken) {
  const context = text
    .slice(Math.max(0, token.start - 18), Math.min(text.length, token.end + 24))
    .toLowerCase()
    .replace(/[µμ]/g, "u")
    .replace(/\s+/g, "");
  return unitVariants(unit).some((variant) => context.includes(variant.replace(/\s+/g, "")));
}

function isVitaminDLabelNumber(pattern: LabPattern, token: NumberToken, text: string) {
  if (pattern.key !== "vitamin_d" || token.value !== 25) return false;
  const after = text.slice(token.end, token.end + 22).toLowerCase();
  const before = text.slice(Math.max(0, token.start - 8), token.start).toLowerCase();
  return /hydroxy|\(?oh\)?/.test(after) || /\b25\s*$/.test(before);
}

function scoreToken(pattern: LabPattern, alias: string, line: string, afterAlias: string, token: NumberToken, firstNonRangeIndex: number, tokenIndex: number) {
  if (isDateLike(afterAlias, token) || isVitaminDLabelNumber(pattern, token, afterAlias)) return null;

  const value = token.value;
  if (value < pattern.min || value > pattern.max) return null;

  const field = bloodworkFieldByKey[pattern.key];
  const rangePart = isReferenceRangePart(afterAlias, token);
  const unit = hasUnitContext(field.unit, afterAlias, token);
  const referenceContext = hasReferenceContext(afterAlias, token);
  const exactAliasBonus = alias === field.shortLabel.toLowerCase() || alias === field.label.toLowerCase() ? 1 : 0;

  let score = 1 + exactAliasBonus;
  score += rangePart ? -6 : 4;
  if (unit) score += 3;
  if (hasResultContext(afterAlias, token)) score += 3;
  if (hasFlagContext(afterAlias, token)) score += 1;
  if (tokenIndex === firstNonRangeIndex) score += 2;
  else if (tokenIndex < 2) score += 1;
  if (referenceContext) score -= rangePart ? 3 : 1;
  if (line.length < 180) score += 1;

  if (score < 5) return null;

  return {
    key: pattern.key,
    label: field.label,
    value,
    unit: field.unit,
    rawLabel: alias,
    score,
    confidence: confidenceFromScore(score)
  } satisfies Candidate;
}

function candidateFromLine(pattern: LabPattern, line: string): Candidate | null {
  const lower = line.toLowerCase();
  if (pattern.rejectLineIncludes?.some((term) => lower.includes(term))) return null;

  const candidates: Candidate[] = [];
  for (const alias of pattern.aliases) {
    const match = aliasRegex(alias).exec(line);
    if (!match || match.index === undefined) continue;

    const aliasStart = match.index + match[1].length;
    const after = line.slice(aliasStart + match[2].length, aliasStart + match[2].length + 180);
    const tokens = numberTokens(after);
    const firstNonRangeIndex = tokens.findIndex((token) => !isReferenceRangePart(after, token) && !isDateLike(after, token));

    tokens.forEach((token, index) => {
      const candidate = scoreToken(pattern, alias, line, after, token, firstNonRangeIndex, index);
      if (candidate) candidates.push(candidate);
    });
  }

  return candidates.sort((a, b) => b.score - a.score)[0] ?? null;
}

export function extractLabValuesFromText(text: string) {
  const candidates = new Map<string, Candidate>();
  const normalized = normalizeText(text);
  const rawLines = normalized
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 3);
  const chunkLines = normalized
    .split(/\n| {3,}|\t/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 3);
  const lines = [...new Set([...rawLines, ...chunkLines])];

  const searchableLines = new Set(lines.length ? lines : [normalized]);
  lines.forEach((line, index) => {
    if (lines[index + 1]) searchableLines.add(`${line} ${lines[index + 1]}`);
    if (lines[index + 1] && lines[index + 2]) searchableLines.add(`${line} ${lines[index + 1]} ${lines[index + 2]}`);
  });
  for (const line of searchableLines) {
    for (const pattern of labPatterns) {
      const candidate = candidateFromLine(pattern, line);
      if (!candidate) continue;
      const current = candidates.get(candidate.key);
      if (!current || candidate.score > current.score) candidates.set(candidate.key, candidate);
    }
  }

  return [...candidates.values()]
    .sort((a, b) => a.label.localeCompare(b.label))
    .map(({ score: _score, ...value }) => value);
}

function unescapePdfLiteral(value: string) {
  return value
    .replace(/\\([nrtbf()\\])/g, (_match, char: string) => {
      const map: Record<string, string> = { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", "(": "(", ")": ")", "\\": "\\" };
      return map[char] ?? char;
    })
    .replace(/\\([0-7]{1,3})/g, (_match, octal: string) => String.fromCharCode(parseInt(octal, 8)));
}

function decodeHexPdfString(hex: string) {
  const compact = hex.replace(/\s+/g, "");
  const bytes: number[] = [];
  for (let index = 0; index < compact.length - 1; index += 2) {
    bytes.push(parseInt(compact.slice(index, index + 2), 16));
  }
  return Buffer.from(bytes).toString("utf8").replace(/\u0000/g, "");
}

function decodePdfTextOperators(content: string) {
  const parts: string[] = [];

  for (const match of content.matchAll(/\[((?:.|\n|\r)*?)\]\s*TJ/g)) {
    const arrayBody = match[1];
    for (const literal of arrayBody.matchAll(/\((?:\\.|[^\\)])*\)/g)) {
      parts.push(unescapePdfLiteral(literal[0].slice(1, -1)));
    }
    for (const hex of arrayBody.matchAll(/<([0-9a-fA-F\s]+)>/g)) {
      parts.push(decodeHexPdfString(hex[1]));
    }
    parts.push("\n");
  }

  for (const match of content.matchAll(/\((?:\\.|[^\\)])*\)\s*Tj/g)) {
    parts.push(unescapePdfLiteral(match[0].replace(/\)\s*Tj$/, "").slice(1)));
    parts.push("\n");
  }

  for (const match of content.matchAll(/<([0-9a-fA-F\s]+)>\s*Tj/g)) {
    parts.push(decodeHexPdfString(match[1]));
    parts.push("\n");
  }

  return parts.join(" ");
}

function extractionScore(text: string) {
  return extractLabValuesFromText(text).length * 5000 + Math.min(text.length, 5000);
}

function extractPdfTextFallback(buffer: Buffer) {
  const chunks: string[] = [];
  const latin = buffer.toString("latin1");
  chunks.push(decodePdfTextOperators(latin));

  const streamRegex = /(<<[\s\S]*?>>)\s*stream\r?\n?([\s\S]*?)\r?\n?endstream/g;
  for (const match of latin.matchAll(streamRegex)) {
    const dictionary = match[1];
    const rawStream = Buffer.from(match[2], "latin1");
    if (dictionary.includes("/FlateDecode")) {
      try {
        chunks.push(decodePdfTextOperators(inflateSync(rawStream).toString("latin1")));
      } catch {
        // Some PDFs use predictors or stream boundaries this lightweight parser cannot decode.
      }
    } else {
      chunks.push(decodePdfTextOperators(rawStream.toString("latin1")));
    }
  }

  return normalizeText(chunks.join("\n"));
}

async function extractPdfText(buffer: Buffer) {
  const fallbackText = extractPdfTextFallback(buffer);

  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });

    try {
      const result = await parser.getText();
      const parsedText = normalizeText(result.text ?? "");
      const text = extractionScore(parsedText) >= extractionScore(fallbackText) ? parsedText : fallbackText;
      const warnings =
        parsedText.length < 40 && fallbackText.length >= 40
          ? ["Advanced PDF text extraction found little readable text, so fallback extraction was used."]
          : [];

      return { text, warnings };
    } finally {
      await parser.destroy();
    }
  } catch {
    return {
      text: fallbackText,
      warnings: [
        "Advanced PDF text extraction could not read this file. If it is password-protected, scanned, or image-only, use OCR or manual values."
      ]
    };
  }
}

async function textFromFile(file: File): Promise<TextExtraction> {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
    const pdf = await extractPdfText(buffer);
    return {
      method: "pdf-text" as const,
      ...pdf
    };
  }

  if (fileType.includes("csv") || fileName.endsWith(".csv") || fileName.endsWith(".tsv")) {
    return {
      method: "csv" as const,
      text: normalizeText(buffer.toString("utf8").replace(/[,\t]/g, " "))
    };
  }

  if (fileType.includes("html") || fileName.endsWith(".html") || fileName.endsWith(".htm")) {
    return {
      method: "html" as const,
      text: normalizeText(buffer.toString("utf8").replace(/<[^>]+>/g, " "))
    };
  }

  if (fileType.includes("text") || fileName.endsWith(".txt")) {
    return {
      method: "text" as const,
      text: normalizeText(buffer.toString("utf8"))
    };
  }

  return {
    method: "unsupported" as const,
    text: ""
  };
}

export async function parseUploadedLabReport(input: FormDataEntryValue | null): Promise<ParsedLabUpload> {
  if (!(input instanceof File) || input.size === 0) {
    return { values: {}, summary: null };
  }

  const warnings: string[] = [];
  if (input.size > maxUploadBytes) {
    return {
      values: {},
      summary: {
        fileName: input.name,
        fileType: input.type || "unknown",
        fileSize: input.size,
        parsedAt: new Date().toISOString(),
        extractionMethod: "unsupported",
        extractedValues: [],
        warnings: [`Upload is larger than ${Math.round(maxUploadBytes / 1024 / 1024)} MB, so it was not parsed.`]
      }
    };
  }

  const extracted = await textFromFile(input);
  warnings.push(...(extracted.warnings ?? []));
  if (extracted.method === "unsupported") {
    warnings.push("Unsupported file type. Upload a PDF, CSV, TXT, or HTML lab export.");
  }
  if (extracted.method === "pdf-text" && extracted.text.length < 40) {
    warnings.push("No readable text was found in the PDF. It may be a scanned image and would need OCR before automatic extraction.");
  }

  const extractedValues = extractLabValuesFromText(extracted.text);
  if (!extractedValues.length && extracted.method !== "unsupported") {
    warnings.push("No supported biomarkers were detected automatically. Use manual values for anything the extractor missed.");
  }
  if (extractedValues.length) {
    warnings.push("Verify extracted values against the report; only moderate/high confidence result-column matches are auto-used.");
  }

  return {
    values: Object.fromEntries(extractedValues.map((value) => [value.key, value.value])),
    summary: {
      fileName: input.name,
      fileType: input.type || "unknown",
      fileSize: input.size,
      parsedAt: new Date().toISOString(),
      extractionMethod: extracted.text.length ? extracted.method : extracted.method === "unsupported" ? "unsupported" : "empty",
      extractedValues,
      warnings
    }
  };
}
