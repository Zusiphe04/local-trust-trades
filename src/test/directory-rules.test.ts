import { describe, expect, it } from "vitest";
import { CATEGORIES, PRO_PRICE, PRO_ANNUAL_PRICE, canAccessProviderPages, signupSchema, saPhoneSchema } from "@/lib/localization";

describe("South African directory rules", () => {
  it("charges R299 for monthly Pro", () => expect(PRO_PRICE).toBe(299));
  it("charges R2990 for annual Pro", () => expect(PRO_ANNUAL_PRICE).toBe(2990));
  it("includes the requested South African service categories", () => expect(CATEGORIES).toEqual(["Plumber", "Electrician", "Handyman", "Solar & Inverter Installer", "Gate & Fence Automation", "Borehole & Water Systems", "Security & Armed Response", "Garden & Tree Felling", "Home Cleaning", "Auto Mechanic"]));
  it("blocks customers from provider pages", () => expect(canAccessProviderPages("customer")).toBe(false));
  it("allows providers into provider pages", () => expect(canAccessProviderPages("provider")).toBe(true));
  it("rejects mismatched signup passwords", () => expect(signupSchema.safeParse({ email: "test@example.com", password: "abcdefgh", confirmPassword: "abcdefgi" }).success).toBe(false));
  it("requires password confirmation", () => expect(signupSchema.safeParse({ email: "test@example.com", password: "abcdefgh" }).success).toBe(false));
  it("accepts matching passwords", () => expect(signupSchema.safeParse({ email: "test@example.com", password: "abcdefgh", confirmPassword: "abcdefgh" }).success).toBe(true));
  it("accepts local and international SA phones and rejects US phones", () => {
    expect(saPhoneSchema.safeParse("082 123 4567").success).toBe(true);
    expect(saPhoneSchema.safeParse("+27 82 123 4567").success).toBe(true);
    expect(saPhoneSchema.safeParse("+1 512 555 0142").success).toBe(false);
  });
});