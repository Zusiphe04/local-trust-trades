import { z } from "zod";

export const CATEGORIES = ["Plumber", "Electrician", "Handyman", "Solar & Inverter Installer", "Gate & Fence Automation", "Borehole & Water Systems", "Security & Armed Response", "Garden & Tree Felling", "Home Cleaning", "Auto Mechanic"] as const;
export const PRO_PRICE = 299;
export const PRO_ANNUAL_PRICE = 2990;
export const CUSTOMER_FEE_NOTICE = "Customers do not pay listing fees. You only pay service providers directly for completed jobs.";
export const canAccessProviderPages = (role: string | undefined) => role === "provider";
export const signupSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128),
}).refine((v) => v.password === v.confirmPassword, { message: "Passwords must match.", path: ["confirmPassword"] });
export const saPhoneSchema = z.string().transform((v) => v.replace(/[\s()-]/g, "")).refine((v) => /^(?:0[1-8]\d{8}|\+27[1-8]\d{8})$/.test(v), "Use a South African number, e.g. 082 123 4567 or +27 82 123 4567.");