/**
 * rin-constants.ts
 * RIN FORMAT: [RegionCode][VehicleCode]-[Sequence]-[DistrictCode][MMYY]
 * EXAMPLE:    GAT-0001-AM0226
 */

export const REGION_CODES: Record<string, string> = {
  "Greater Accra": "GA",
};

export const DISTRICT_CODES: Record<string, string> = {
  "Accra Metropolitan":         "AM",
  "Tema Metropolitan":          "TM",
  "Ga East Municipal":          "GE",
  "Ga West Municipal":          "GW",
  "Ga Central Municipal":       "GC",
  "Ga South Municipal":         "GS",
  "Adenta Municipal":           "AD",
  "Ledzokuku Municipal":        "LD",
  "Krowor Municipal":           "KR",
  "Ningo Prampram":             "NP",
  "Shai Osudoku":               "SO",
  "Ayawaso East Municipal":     "AE",
  "Ayawaso West Municipal":     "AW",
  "Ayawaso Central Municipal":  "AC",
  "Ablekuma North Municipal":   "AN",
  "Ablekuma Central Municipal": "AB",
  "Ablekuma West Municipal":    "AX",
  "La Nkwantanang-Madina":      "LN",
  "La Dade Kotopon Municipal":  "LK",
  "Okaikwei North Municipal":   "OK",
  "Weija Gbawe Municipal":      "WG",
  "Korle Klottey Municipal":    "KK",
  "Ashaiman Municipal":         "AS",
  "Kpone Katamanso":            "KP",
};

export const CATEGORY_CODES: Record<string, string> = {
  "Motorbike":   "M",
  "Tricycle":    "T",
  "Pragya":      "P",
  "Quadricycle": "Q",
};

export function toMMYY(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  return `${mm}${yy}`;
}

export function padSequence(n: number): string {
  return String(n).padStart(4, "0");
}

export function composeRIN(
  regionCode:   string,
  vehicleCode:  string,
  sequence:     number,
  districtCode: string,
  date:         Date
): string {
  return `${regionCode}${vehicleCode}-${padSequence(sequence)}-${districtCode}${toMMYY(date)}`;
}

export function parseRIN(rin: string): {
  regionCode:   string;
  vehicleCode:  string;
  sequence:     number;
  districtCode: string;
  mmyy:         string;
} | null {
  const match = rin.match(/^([A-Z]{2})([A-Z])-(\d{4})-([A-Z]{2})(\d{4})$/);
  if (!match) return null;
  return {
    regionCode:   match[1],
    vehicleCode:  match[2],
    sequence:     parseInt(match[3], 10),
    districtCode: match[4],
    mmyy:         match[5],
  };
}

export function isValidRIN(rin: string): boolean {
  return parseRIN(rin) !== null;
}

export function getCounterPath(
  districtCode: string,
  vehicleCode:  string
): string {
  return `rin_counters/${districtCode}-${vehicleCode}`;
}

export const COUNTER_START = 1;
