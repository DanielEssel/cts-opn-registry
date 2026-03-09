import { DISTRICT_CODES, CATEGORY_CODES } from "@/lib/rin-constants";

export type RINParts = {
  districtCode: string;
  categoryCode?: string;
  sequence: number;
  month: string; // "02"
  year: string; // "26"
};

export function formatRINV2(input: {
  districtMunicipality: string;
  vehicleCategory: string;
  sequence: number;
  date?: Date;
}) {
  const districtCode = DISTRICT_CODES[input.districtMunicipality];
  const categoryCode = CATEGORY_CODES[input.vehicleCategory];

  if (!districtCode) throw new Error("Invalid district");
  if (!categoryCode) throw new Error("Invalid vehicle category");

  const d = input.date ?? new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  const seq = String(input.sequence).padStart(4, "0");

  // مثال NEW FORMAT (you decide this):
  // DISTRICT-CAT-SEQ-MM-YY  => AM-QC-1001-02-26
  return `${districtCode}-${categoryCode}-${seq}-${month}-${year}`;
}

/**
 * Parse BOTH v1 and v2 formats so verification/search doesn't break.
 * v1: AM-1001-02-26
 * v2: AM-QC-1001-02-26
 */
export function parseRIN(RIN: string): { version: "v1" | "v2"; parts: RINParts } | null {
  const parts = RIN.split("-");

  // v2 expected length = 5
  if (parts.length === 5) {
    const [districtCode, categoryCode, seqStr, month, year] = parts;
    const sequence = Number(seqStr);
    if (!districtCode || !categoryCode || !Number.isFinite(sequence)) return null;
    return { version: "v2", parts: { districtCode, categoryCode, sequence, month, year } };
  }

  // v1 expected length = 4
  if (parts.length === 4) {
    const [districtCode, seqStr, month, year] = parts;
    const sequence = Number(seqStr);
    if (!districtCode || !Number.isFinite(sequence)) return null;
    return { version: "v1", parts: { districtCode, sequence, month, year } };
  }

  return null;
}