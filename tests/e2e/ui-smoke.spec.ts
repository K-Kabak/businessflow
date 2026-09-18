import { expect, test } from "@playwright/test";

test("core UI routes, theme, and mobile navigation remain usable", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Use Admin Demo" }).click();
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  const routes = [
    ["/dashboard", /Good to see you/],
    ["/clients", "Clients"],
    ["/projects", "Projects"],
    ["/tasks", "Tasks"],
    ["/board", "Board"],
    ["/team", "Team"],
    ["/activity", "Activity"],
    ["/settings/profile", "Profile settings"],
    ["/settings/organization", "Organization settings"],
  ] as const;

  for (const [path, heading] of routes) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: heading, level: 1 }),
    ).toBeVisible();
  }

  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  const mobileNavigation = page
    .getByRole("navigation", { name: "Main navigation" })
    .last();
  await expect(mobileNavigation).toBeVisible();
  await mobileNavigation.getByRole("link", { name: "Dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Open account menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
});
