import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("journeyos:demo-mode", "active"));
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
});

test("dashboard prioritizes the next journey", async ({ page }) => {
  await expect(page.getByText("Deine nächste Reise")).toBeVisible();
  await expect(page.getByText(/Noch .* bis Island/)).toBeVisible();
});

test("journey detail uses focused URL tabs", async ({ page }) => {
  await page.goto("/trips/trip-iceland-ring?tab=overview");
  await expect(page.getByRole("navigation", { name: "Reisebereiche" })).toBeVisible();
  await page.getByRole("link", { name: "Packliste" }).click();
  await expect(page).toHaveURL(/tab=packing/);
  await expect(page.getByRole("paragraph").filter({ hasText: "Packliste" })).toBeVisible();
});

test("new journey wizard restores its draft", async ({ page }) => {
  await page.goto("/trips/new");
  await expect(page.getByText("Schritt 1 von 5")).toBeVisible();
  await page.evaluate(() => localStorage.setItem("journeyos:trip-draft:v2", JSON.stringify({
    step: 4,
    input: { title: "Gespeicherter Entwurf", destinationName: "Wien, Österreich", destinationCountryCode: "AT", countries: [] },
  })));
  await page.reload();
  await expect(page.getByText("Schritt 4 von 5")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Name der Reise" })).toHaveValue("Gespeicherter Entwurf");
});
