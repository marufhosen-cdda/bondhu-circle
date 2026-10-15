import { expect, test } from "@playwright/test";

import { activityAddress, closeDb, findBookableActivityId, readOtp } from "./helpers/db";

test.afterAll(async () => {
  await closeDb();
});

test.describe("public site", () => {
  test("landing page renders in English and Bangla", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Find your people");

    await page.goto("/bn");
    await expect(page.locator("html")).toHaveAttribute("lang", "bn");
  });

  test("guidelines are readable without an account", async ({ page }) => {
    await page.goto("/en/guidelines");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Community guidelines");

    await page.goto("/en/credits");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("the app is installable (manifest + icons)", async ({ request }) => {
    const manifest = await request.get("/manifest.webmanifest");
    expect(manifest.ok()).toBe(true);
    const body = await manifest.json();
    expect(body.name).toContain("Bondhu");
    expect(body.icons.map((icon: { sizes: string }) => icon.sizes)).toContain("512x512");

    const icon = await request.get("/icons/icon-512.png");
    expect(icon.ok()).toBe(true);
    expect(icon.headers()["content-type"]).toContain("image/png");
  });

  test("signed-out members are sent to sign-in", async ({ page }) => {
    await page.goto("/en/activities");
    await expect(page).toHaveURL(/\/sign-in/);
  });
});

test.describe("member journey", () => {
  test("sign in → onboard → verify phone → RSVP reveals the venue", async ({ page }) => {
    const stamp = Date.now();
    const email = `e2e.${stamp}@bondhu.test`;
    // Valid Bangladeshi mobile format, unique per run.
    const phone = `018${String(stamp).slice(-8)}`;

    // ---------------------------------------------------------------- sign in
    await page.goto("/en/sign-in");
    await page.getByLabel("Email address").fill(email);
    await page.getByRole("button", { name: "Send code" }).click();

    await expect(page).toHaveURL(/\/verify/);

    // The code lands in the verifications table (Better Auth stores it in clear).
    await expect
      .poll(() => readOtp(email), { message: "email OTP should be stored" })
      .toMatch(/^\d{6}$/);
    const emailCode = await readOtp(email);

    await page.getByLabel("6-digit code").fill(emailCode);
    await page.getByRole("button", { name: "Verify and continue" }).click();

    // ------------------------------------------------------------- onboarding
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Set up your profile");

    // Step 1 — interests (3–8).
    const chips = page.locator('button[aria-pressed]');
    for (let index = 0; index < 3; index += 1) await chips.nth(index).click();
    await page.getByRole("button", { name: "Next" }).click();

    // Step 2 — area.
    await page.getByRole("heading", { name: /Where do you live/ }).waitFor();
    await page.locator('button[aria-pressed]').first().click();
    await page.getByRole("button", { name: "Next" }).click();

    // Step 3 — availability.
    await page.getByRole("heading", { name: /When are you usually free/ }).waitFor();
    await page.locator('button[aria-pressed]').first().click();
    await page.getByRole("button", { name: "Next" }).click();

    // Step 4 — preferences + guidelines.
    await page.getByRole("heading", { name: /How should your circle look/ }).waitFor();
    await page.getByRole("checkbox", { name: /I have read and accept/ }).click();
    await page.getByRole("button", { name: "Finish setup" }).click();

    await expect(page.getByText("All set").first()).toBeVisible({ timeout: 30_000 });

    // --------------------------------------------------- phone verification
    await page.goto("/en/settings");
    await page.getByLabel("Phone number").fill(phone);
    await page.getByRole("button", { name: "Send code" }).click();

    await expect
      .poll(() => readOtp(phone.replace(/^0/, "")), { message: "SMS OTP should be stored" })
      .toMatch(/^\d{6}$/);
    const smsCode = await readOtp(phone.replace(/^0/, ""));

    await page.getByLabel("6-digit code").fill(smsCode);
    await page.getByRole("button", { name: "Verify", exact: true }).click();
    await expect(page.getByText("Phone verified")).toBeVisible({ timeout: 30_000 });

    // ------------------------------------------------------------------ RSVP
    const activityId = await findBookableActivityId();
    const address = await activityAddress(activityId);

    await page.goto(`/en/activities/${activityId}`);

    // The exact venue stays hidden until the RSVP is confirmed.
    await expect(page.getByText("Address visible after you RSVP")).toBeVisible();

    await page.getByRole("button", { name: "Join", exact: true }).click();
    await expect(page.getByText("You are in")).toBeVisible({ timeout: 30_000 });

    if (address) {
      await expect(page.getByText(address)).toBeVisible();
      await expect(page.getByText("Address visible after you RSVP")).toBeHidden();
    }
  });
});
