/**
 * lib/toast-utils.ts
 * Centralized toast notifications for the entire app
 */

import { toast } from "sonner";

export const TOAST_IDS = {
  LOGIN: "login",
  REGISTRATION: "registration",
  BULK_RENEW: "bulk-renew",
  QR: "qr",
};

export const toasts = {

  /* ───────────────── AUTH ───────────────── */

  loginLoading: () =>
    toast.loading("Signing you in...", { id: TOAST_IDS.LOGIN }),
  loading: (msg = "Loading...") => toast.loading(msg),

  loginSuccess: () =>
    toast.success("Welcome back!", {
      id: TOAST_IDS.LOGIN,
      description: "You are now signed in.",
    }),

  loginError: (msg?: string) =>
    toast.error("Login failed", {
      id: TOAST_IDS.LOGIN,
      description: msg ?? "Check your credentials and try again.",
    }),

  logoutSuccess: () =>
    toast.success("Signed out successfully."),

  /* ─────────────── REGISTRATION ─────────────── */

  registrationLoading: () =>
    toast.loading("Registering rider...", { id: TOAST_IDS.REGISTRATION }),

  registrationSuccess: (rin: string) =>
    toast.success("Rider registered!", {
      id: TOAST_IDS.REGISTRATION,
      description: `RIN: ${rin}`,
    }),

  registrationError: (msg?: string) =>
    toast.error("Registration failed", {
      id: TOAST_IDS.REGISTRATION,
      description: msg ?? "Please try again.",
    }),

  /* ─────────────── RIDER ACTIONS ─────────────── */

  riderUpdated: () =>
    toast.success("Rider updated successfully."),

  riderDeleted: () =>
    toast.success("Rider deleted successfully."),

  riderUpdateError: (msg?: string) =>
    toast.error("Update failed", { description: msg }),

  riderNotFound: () =>
    toast.error("Rider not found.", {
      description: "Check the RIN and try again.",
    }),

  /* ─────────────── STATUS ─────────────── */

  statusUpdated: (status: string) =>
    toast.success(`Status updated to ${status}.`),

  statusError: (msg?: string) =>
    toast.error("Status update failed", { description: msg }),

  /* ─────────────── RENEWAL ─────────────── */

  renewLoading: () =>
    toast.loading("Renewing permit..."),

  renewSuccess: (name: string) =>
    toast.success(`${name}'s permit renewed.`),

  renewError: (msg?: string) =>
    toast.error("Renewal failed", { description: msg }),

  /* ─────────────── BULK RENEW ─────────────── */

  bulkRenewLoading: () =>
    toast.loading("Renewing permits...", { id: TOAST_IDS.BULK_RENEW }),

  bulkRenewSuccess: (count: number) =>
    toast.success(`${count} permits renewed.`, { id: TOAST_IDS.BULK_RENEW }),

  bulkRenewError: (msg?: string) =>
    toast.error("Bulk renewal failed", {
      id: TOAST_IDS.BULK_RENEW,
      description: msg,
    }),

  /* ─────────────── QR CODE ─────────────── */

  qrLoading: () =>
    toast.loading("Generating QR code...", { id: TOAST_IDS.QR }),

  qrSuccess: () =>
    toast.success("QR code ready.", { id: TOAST_IDS.QR }),

  qrError: () =>
    toast.error("QR generation failed", {
      id: TOAST_IDS.QR,
      description:
        "Registration was saved but QR could not be generated.",
    }),

  /* ─────────────── CLIPBOARD ─────────────── */

  copied: (label: string) =>
    toast.success(`${label} copied to clipboard.`),

  /* ─────────────── EXPORT ─────────────── */

  exportSuccess: (type: string) =>
    toast.success(`${type} exported successfully.`),

  exportError: () =>
    toast.error("Export failed", {
      description: "Please try again.",
    }),

  /* ─────────────── GENERIC ─────────────── */

  success: (msg: string, description?: string) =>
    toast.success(msg, { description }),

  error: (msg: string, description?: string) =>
    toast.error(msg, { description }),

  info: (msg: string, description?: string) =>
    toast.info(msg, { description }),

  warning: (msg: string, description?: string) =>
    toast.warning(msg, { description }),

  dismiss: (id: string) =>
    toast.dismiss(id),
};