import { createHmac } from "node:crypto";

export type PaytrConfig = {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
  testMode: "0" | "1";
};

export function getPaytrConfig(): PaytrConfig {
  const { PAYTR_MERCHANT_ID, PAYTR_MERCHANT_KEY, PAYTR_MERCHANT_SALT, PAYTR_TEST_MODE } = process.env;
  if (!PAYTR_MERCHANT_ID || !PAYTR_MERCHANT_KEY || !PAYTR_MERCHANT_SALT) {
    throw new Error("PAYTR_CONFIG_MISSING");
  }
  return {
    merchantId: PAYTR_MERCHANT_ID,
    merchantKey: PAYTR_MERCHANT_KEY,
    merchantSalt: PAYTR_MERCHANT_SALT,
    testMode: PAYTR_TEST_MODE === "true" ? "1" : "0",
  };
}

export function paytrHmac(value: string, merchantKey: string) {
  return createHmac("sha256", merchantKey).update(value).digest("base64");
}

export function clientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "127.0.0.1";
}
