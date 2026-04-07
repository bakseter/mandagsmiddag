import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("loads and shows dinner list heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /alle middager/i })).toBeVisible();
  });

  test("admin nav links are visible", async ({ page }) => {
    await page.goto("/");
    // LOCAL=true backend always returns admin user — wait for admin UI to render
    await expect(page.getByRole("link", { name: /ny middag/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole("link", { name: /se ratings/i })).toBeVisible();
  });
});
