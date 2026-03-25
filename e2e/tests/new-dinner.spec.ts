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

    // Fill in the form
    const today = new Date().toISOString().split("T")[0];
    await page.getByLabel(/dato/i).fill(today);
    await page.getByLabel(/mat/i).fill("E2E Test Pizza");

    // Select host (first option in the list)
    const hostSelect = page.getByLabel(/vert/i);
    await hostSelect.selectOption({ index: 1 });

    // Submit
    await page.getByRole("button", { name: /lagre/i }).click();

    // Expect success feedback or redirect to home
    await expect(page).toHaveURL("/", { timeout: 10_000 });

    // Dinner should now appear on home page
    await expect(page.getByText("E2E Test Pizza")).toBeVisible();
  });
});
