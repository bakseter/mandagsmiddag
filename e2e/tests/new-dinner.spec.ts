import { test, expect } from "@playwright/test";

test.describe("New dinner", () => {
  test("admin can create a dinner and it appears on the home page", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for admin UI to be ready (LOCAL=true backend returns admin)
    await expect(page.getByRole("link", { name: /ny middag/i })).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("link", { name: /ny middag/i }).click();
    await expect(page).toHaveURL(/\/middag\/ny/);

    // Wait for users to load (form shows loading state until GET /api/user completes)
    await page.waitForLoadState("networkidle");

    // Fill in the form — labels have no htmlFor, use name selectors
    const today = new Date().toISOString().split("T")[0];
    await page.locator('input[name="date"]').fill(today);
    await page.locator('input[name="food"]').fill("E2E Test Pizza");

    // Select host (first real option, skip the placeholder)
    await page.locator('select[name="hostUserId"]').selectOption({ index: 1 });

    // Submit
    await page.getByRole("button", { name: /legg til middag/i }).click();

    // Expect inline success feedback
    await expect(page.getByText(/middag lagt til/i)).toBeVisible({
      timeout: 10_000,
    });

    // Navigate home and verify dinner appears
    await page.goto("/");
    await expect(page.getByText("E2E Test Pizza")).toBeVisible({
      timeout: 10_000,
    });
  });
});
