import { test, expect } from "@playwright/test";

// GRA-12 — catalog hosts must resolve and serve HTTPS
for (const host of ["credit-ratings.graphai.eu", "credit.graphai.eu"] as const) {
  test(`GRA-12 ${host} resolves and serves HTTPS`, async ({ page }) => {
    const res = await page.goto(`https://${host}/`, { waitUntil: "domcontentloaded" });
    expect(res, "navigation response").not.toBeNull();
    expect(res!.ok(), `HTTP ${res!.status()}`).toBeTruthy();
  });
}
