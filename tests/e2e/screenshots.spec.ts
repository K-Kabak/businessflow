import { expect, test } from "@playwright/test";

test.skip(!process.env.CAPTURE_SCREENSHOTS, "Run only for README assets.");

test("capture seeded product screens", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/login");
  await page.screenshot({
    path: "docs/screenshots/login.png",
    fullPage: true,
    caret: "initial",
  });

  await page.getByRole("button", { name: "Use Admin Demo" }).click();
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(
    page.getByRole("heading", { name: /Good to see you/ }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/dashboard.png",
    fullPage: true,
    caret: "initial",
  });

  await page.goto("/clients");
  await expect(page.getByRole("heading", { name: "Clients" })).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/clients.png",
    fullPage: true,
    caret: "initial",
  });

  await page.goto("/board");
  await expect(page.getByRole("heading", { name: "Board" })).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/kanban.png",
    fullPage: true,
    caret: "initial",
  });

  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.goto("/dashboard");
  await page.screenshot({
    path: "docs/screenshots/dashboard-dark.png",
    fullPage: true,
    caret: "initial",
  });
  await page.goto("/board");
  await page.screenshot({
    path: "docs/screenshots/kanban-dark.png",
    fullPage: true,
    caret: "initial",
  });

  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/clients");
  await page.screenshot({
    path: "docs/screenshots/clients-mobile.png",
    fullPage: true,
    caret: "initial",
  });
  await page.goto("/board");
  await page.screenshot({
    path: "docs/screenshots/kanban-mobile.png",
    fullPage: true,
    caret: "initial",
  });
});
