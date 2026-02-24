export const DISTRICTS = [
  "Accra Metro",
  "Tema Metro",
  "Ga East",
  "Ga West",
  "Ga South",
  "Ga Central",
  "Adentan",
  "Ledzokuku",
  "Krowor",
  "Ashaiman",
  "Shai Osudoku",
  "Ningo Prampram",
  "La Nkwantanang-Madina",
  "La Dade-Kotopon",
  "Ablekuma North",
  "Ablekuma Central",
  "Ablekuma West",
  "Ayawaso East",
  "Ayawaso North",
  "Ayawaso West Wuogon",
  "Okaikwei North",
  "Weija-Gbawe",
  "Korle Klottey",
  "Kpone Katamanso",
  "National HQ",
] as const;

export type District = (typeof DISTRICTS)[number];

export const ROLES = ["Super Admin", "District Admin", "Operator"] as const;
export type Role = (typeof ROLES)[number];