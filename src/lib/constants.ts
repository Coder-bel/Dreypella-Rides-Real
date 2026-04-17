/** Support / Admin WhatsApp number (fixed) */
export const SUPPORT_WHATSAPP = "2348082144372";

/** Allowed biker emails for legacy MVP login (kept for backward compatibility) */
export const ALLOWED_BIKER_EMAILS = ["okikibeloved@gmail.com"];

/** Shared biker password for legacy MVP login */
export const BIKER_PASSWORD = "12345678";

/** Official Opay account details — used everywhere payment instructions appear */
export const OPAY_ACCOUNT = {
  name: "Dreypella Ride",
  bank: "Opay",
  number: "8082144372",
} as const;

/* ──────────────  Validation helpers  ────────────── */

/** Phone must be exactly 11 digits (e.g. 08012345678) */
export const PHONE_REGEX = /^\d{11}$/;
export const PHONE_ERROR =
  "Phone number must be exactly 11 digits (e.g., 08012345678)";

export const isValidPhone = (phone: string) =>
  PHONE_REGEX.test(phone.trim());

/** Password: 8+ chars, at least one letter, one number, one special char */
export const PASSWORD_REGEX =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
export const PASSWORD_ERROR =
  "Password must be at least 8 characters and include letters, numbers, and special characters";

export const isValidPassword = (pw: string) => PASSWORD_REGEX.test(pw);

/** Generate a unique company code: DPR-XXXX (4 digits) */
export const generateCompanyCode = () =>
  "DPR-" + Math.floor(1000 + Math.random() * 9000);
