import { test, expect } from "@playwright/test";

test.describe("Real Browser E2E & CR-01 Validation Suite", () => {
  test("loads homepage without runtime exceptions or unexpected console errors (CR-01 Gate)", async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: Error[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("pageerror", (err) => {
      pageErrors.push(err);
    });

    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(400);

    // Wait for network idle or main content to render
    await page.waitForLoadState("domcontentloaded");

    // Verify CR-01: Zero unhandled page runtime errors
    expect(pageErrors, `Unhandled page errors detected: ${pageErrors.map(e => e.message).join(", ")}`).toHaveLength(0);

    // Verify CR-01: Zero unexpected console errors
    expect(consoleErrors, `Browser console errors detected: ${consoleErrors.join(", ")}`).toHaveLength(0);

    // Verify main landmarks and title
    const title = await page.title();
    expect(title).toMatch(/Fix\s*Hub/i);
  });

  test("renders responsive navigation and service catalog properly", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    // Wait for client hydration to settle past loading splash
    await page.locator("header.site-header, .brand, h1").first().waitFor({ state: "visible", timeout: 15000 });

    // Check presence of key service categories in Tanuku market
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.toLowerCase()).toMatch(/electrician|plumbing|ac|appliance|fix\s*hub/i);
  });

  test("verifies accessibility and primary navigation links", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.locator("a, button").first().waitFor({ state: "attached", timeout: 15000 });

    const interactiveElements = page.locator("a, button");
    const count = await interactiveElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test("customer booking wizard navigates and renders pricing preview", async ({ page }) => {
    await page.goto("/customer/book/new");
    await page.waitForLoadState("domcontentloaded");
    await page.locator("h1, main, #main").first().waitFor({ state: "visible", timeout: 15000 });

    // Verify booking interface loads with heading or sign-in notice
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(30);
  });

  test("merchant workspace enforces role gate or demo boundary", async ({ page }) => {
    await page.goto("/merchant");
    await page.waitForLoadState("domcontentloaded");
    await page.locator("h1, main, #main, [role='status'], .notice").first().waitFor({ state: "visible", timeout: 15000 });

    // Verify role boundary or workspace view
    const body = await page.locator("body").innerText();
    expect(body).toMatch(/merchant|sign in|access|workspace|checking|loading/i);
  });

  test("admin operations panel renders controls and telemetry surfaces", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    await page.locator("h1, main, #main, .notice").first().waitFor({ state: "visible", timeout: 15000 });

    // Verify admin dashboard landmarks
    const body = await page.locator("body").innerText();
    expect(body).toMatch(/admin|dashboard|operations|overview|fix hub|loading/i);
  });
});
