import { test, expect } from "@playwright/test";

// Seeds a dinner via the API so we can test rating without going through the UI form
async function seedDinner(request: Parameters<typeof test>[1] extends { request: infer R } ? R : never) {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

  // First sync the local dev user
  await request.put("http://localhost:8080/api/user");

  // Get users to find the dev user's ID
  const usersResp = await request.get("http://localhost:8080/api/user");
  const users = await usersResp.json();
  const devUser = users.find((u: { email: string }) => u.email === "dev@example.com");

  if (!devUser) throw new Error("dev@example.com not found — is LOCAL=true set on the backend?");

  const resp = await request.put("http://localhost:8080/api/dinner", {
    data: {
      hostUserId: devUser.id,
      date: twoDaysAgo,
      food: "E2E Rating Test Dinner",
      participantIds: [devUser.id],
    },
  });

  if (!resp.ok()) throw new Error(`Failed to seed dinner: ${resp.status()}`);
}

test.describe("Ratings", () => {
  test.beforeEach(async ({ request }) => {
    await seedDinner(request);
  });

  test("user can add a rating to a recent dinner", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Find the seeded dinner card and click the rating link
    const dinnerCard = page.getByText("E2E Rating Test Dinner").first();
    await expect(dinnerCard).toBeVisible({ timeout: 10_000 });

    await page.getByRole("link", { name: /legg til rating/i }).first().click();

    // Fill in film score
    await page.getByLabel(/film/i).fill("8");

    // Submit
    await page.getByRole("button", { name: /lagre/i }).click();

    // Should redirect back
    await expect(page).toHaveURL("/", { timeout: 10_000 });
  });

  test("admin ratings page renders", async ({ page }) => {
    await page.goto("/admin/ratings");
    await page.waitForLoadState("networkidle");
    // Page should not redirect away (admin-only gate passes with LOCAL=true)
    await expect(page).toHaveURL("/admin/ratings");
  });
});
