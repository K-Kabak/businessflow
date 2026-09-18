import { expect, test } from "@playwright/test";

test.skip(
  !process.env.VISUAL_REGRESSION,
  "Run only for visual regression baselines.",
);

const screens = [
  {
    name: "login",
    path: "/login",
    heading: "Welcome back",
    authenticated: false,
  },
  {
    name: "dashboard",
    path: "/dashboard",
    heading: /Good to see you/,
    authenticated: true,
  },
  {
    name: "clients",
    path: "/clients",
    heading: "Clients",
    authenticated: true,
  },
  { name: "board", path: "/board", heading: "Board", authenticated: true },
] as const;

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;

for (const screen of screens) {
  for (const viewport of viewports) {
    for (const theme of ["light", "dark"] as const) {
      test(`${screen.name} ${viewport.name} ${theme}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.emulateMedia({ colorScheme: theme });
        await page.addInitScript((selectedTheme) => {
          window.localStorage.setItem("theme", selectedTheme);
        }, theme);

        if (screen.authenticated) {
          await page.goto("/login");
          await page.getByRole("button", { name: "Use Admin Demo" }).click();
          await page.getByRole("button", { name: "Sign in" }).click();
          await expect(page).toHaveURL(/\/dashboard/);
        }

        await page.goto(screen.path);
        await expect(
          page.getByRole("heading", { name: screen.heading }),
        ).toBeVisible();
        await page.addStyleTag({
          content: "[data-visual-dynamic]{visibility:hidden!important}",
        });
        await expect(page).toHaveScreenshot(
          `${screen.name}-${viewport.name}-${theme}.png`,
          { animations: "disabled", caret: "initial", fullPage: false },
        );
      });
    }
  }
}
