import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("loads and shows search form", async ({ page }) => {
    await page.goto("/");

    // Logo and title
    await expect(page.locator("h1")).toContainText("AgiliFind");

    // Search form elements
    await expect(page.getByPlaceholder("City, state, or zip code")).toBeVisible();
    await expect(page.getByRole("button", { name: "Search" })).toBeVisible();

    // Org filter checkboxes
    await expect(page.getByText("AKC")).toBeVisible();
    await expect(page.getByText("USDAA")).toBeVisible();
    await expect(page.getByText("CPE")).toBeVisible();
  });

  test("shows initial search prompt", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Search for agility trials")).toBeVisible();
    await expect(
      page.getByText("Enter your location")
    ).toBeVisible();
  });

  test("shows list/map view toggle", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("button", { name: "List" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Map" })).toBeVisible();
  });

  test("nav links are visible", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Training")).toBeVisible();
  });
});

test.describe("Training spaces page", () => {
  test("loads and shows search form", async ({ page }) => {
    await page.goto("/training-spaces");

    await expect(page.getByText("Training Spaces")).toBeVisible();
    await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
  });
});

test.describe("Login page", () => {
  test("loads and shows login form", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByText("Log in")).toBeVisible();
  });
});
