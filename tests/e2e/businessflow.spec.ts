import { expect, test } from "@playwright/test";

async function signIn(
  page: import("@playwright/test").Page,
  email = "admin@businessflow.local",
) {
  await page.goto("/login");
  await page
    .getByRole("button", {
      name: email.startsWith("employee")
        ? "Use Employee Demo"
        : "Use Admin Demo",
    })
    .click();
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test("admin signs in and creates a client", async ({ page }) => {
  await signIn(page);
  await expect(
    page.getByRole("heading", { name: /Good to see you/ }),
  ).toBeVisible();
  await page.goto("/clients/new");
  await page.getByLabel("Client name").fill("E2E Example Client");
  await page.getByLabel("Company").fill("Example Company");
  await page.getByRole("button", { name: "Create client" }).click();
  await expect(page).toHaveURL(/\/clients\//);
  await expect(
    page.getByRole("heading", { name: "E2E Example Client" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Edit" }).click();
  await page.getByLabel("Client name").fill("E2E Example Client Updated");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("heading", { name: "E2E Example Client Updated" }),
  ).toBeVisible();
});

test("client form validation and filtered empty state are usable", async ({
  page,
}) => {
  await signIn(page);
  await page.goto("/clients/new");
  await page.getByRole("button", { name: "Create client" }).click();
  await expect(page.getByText("Name is required.")).toBeVisible();

  await page.goto("/clients?search=definitely-no-client");
  await expect(
    page.getByRole("heading", { name: "No clients match these filters" }),
  ).toBeVisible();
});

test("admin can create a project and task", async ({ page }) => {
  await signIn(page);
  await page.goto("/projects/new");
  await page.getByLabel("Project name").fill("E2E Delivery Project");
  await page.getByLabel(/Marek Nowak/).check();
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(
    page.getByRole("heading", { name: "E2E Delivery Project" }),
  ).toBeVisible();
  await page.goto("/tasks/new");
  await page.getByLabel("Task title").fill("E2E delivery task");
  await page
    .getByLabel("Project")
    .selectOption({ label: "E2E Delivery Project" });
  await page.getByRole("button", { name: "Create task" }).click();
  await expect(page).toHaveURL(/\/tasks/);
  await expect(
    page.getByRole("row").filter({ hasText: "E2E delivery task" }),
  ).toBeVisible();
});

test("Kanban move persists after refresh", async ({ page }) => {
  await signIn(page);
  await page.goto("/board");
  await page
    .getByLabel("Filter project")
    .selectOption({ label: "Website Redesign" });
  await page.getByRole("button", { name: "Apply filters" }).click();
  const taskHandle = page.getByRole("button", {
    name: "Move Create landing page",
    exact: true,
  });
  const doneColumn = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Done" }),
  });
  const source = await taskHandle.boundingBox();
  const target = await doneColumn
    .getByRole("heading", { name: "Done" })
    .boundingBox();
  expect(source).not.toBeNull();
  expect(target).not.toBeNull();
  await page.mouse.move(
    source!.x + source!.width / 2,
    source!.y + source!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    source!.x + source!.width / 2 + 12,
    source!.y + source!.height / 2,
    { steps: 4 },
  );
  await page.mouse.move(
    target!.x + target!.width / 2,
    target!.y + target!.height / 2,
    { steps: 20 },
  );
  await page.mouse.up();
  await expect(doneColumn.getByText("Create landing page")).toBeVisible();
  await expect(page.getByText("Board updated.")).toBeVisible();
  await page.reload();
  await expect(doneColumn.getByText("Create landing page")).toBeVisible();
});

test("employee has scoped, read-only access", async ({ page }) => {
  await signIn(page, "employee@businessflow.local");
  await page.goto("/settings/organization");
  await expect(page.getByText("Page not found")).toBeVisible();
  await page.goto("/clients");
  await expect(page.getByRole("link", { name: "Add client" })).toHaveCount(0);
  await page.goto("/tasks");
  await expect(page.getByLabel("Update task status").first()).toBeVisible();
});

test("foreign tenant identifiers are indistinguishable from missing resources", async ({
  page,
}) => {
  await signIn(page);
  await page.goto("/clients/e2e_foreign_client");
  await expect(page.getByText("Page not found")).toBeVisible();
});

test("theme preference and mobile navigation work", async ({ page }) => {
  await signIn(page);
  await page.getByRole("button", { name: /Switch to dark mode/ }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }).last(),
  ).toBeVisible();
});
