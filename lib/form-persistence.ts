// lib/form-persistence.ts
// Persists multi-step form state to sessionStorage.
// sessionStorage: survives refresh, clears on tab close — perfect for forms.

import type { PreRegistrationData } from "@/lib/pre-registration-schema";

const FORM_KEY  = "pcraa_prereg_form_v1";
const PHOTO_KEY = "pcraa_prereg_photo_v1";
const STEP_KEY  = "pcraa_prereg_step_v1";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PersistedFormState {
  values:         Partial<PreRegistrationData>;
  step:           number;
  completedSteps: number[];
}

// ── Save ──────────────────────────────────────────────────────────────────────

export function persistFormState(state: PersistedFormState): void {
  try {
    sessionStorage.setItem(FORM_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage quota exceeded — non-fatal, form still works
    console.warn("[persistence] Could not save form state (quota exceeded?)");
  }
}

export function persistPhoto(photo: string | null): void {
  try {
    if (photo) {
      sessionStorage.setItem(PHOTO_KEY, photo);
    } else {
      sessionStorage.removeItem(PHOTO_KEY);
    }
  } catch {
    // Photo too large for sessionStorage — non-fatal
    console.warn("[persistence] Could not save photo (too large?)");
  }
}

// ── Load ──────────────────────────────────────────────────────────────────────

export function loadPersistedFormState(): PersistedFormState | null {
  try {
    const raw = sessionStorage.getItem(FORM_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedFormState;
  } catch {
    return null;
  }
}

export function loadPersistedPhoto(): string | null {
  try {
    return sessionStorage.getItem(PHOTO_KEY);
  } catch {
    return null;
  }
}

// ── Clear ─────────────────────────────────────────────────────────────────────

export function clearPersistedFormState(): void {
  try {
    sessionStorage.removeItem(FORM_KEY);
    sessionStorage.removeItem(PHOTO_KEY);
    sessionStorage.removeItem(STEP_KEY);
  } catch {}
}