import { execFileSync } from "node:child_process";

export function requireE2eDatabase(databaseUrl: string | undefined) {
  if (!databaseUrl)
    throw new Error("E2E_DATABASE_URL must be configured for Playwright.");

  const url = new URL(databaseUrl);
  const databaseName = decodeURIComponent(url.pathname).replace(/^\//, "");
  if (databaseName !== "businessflow_e2e")
    throw new Error(
      `Refusing to prepare database “${databaseName || "unknown"}”. Expected “businessflow_e2e”.`,
    );
  return databaseUrl;
}

export default function globalSetup() {
  const databaseUrl = requireE2eDatabase(process.env.E2E_DATABASE_URL);
  const pnpmCli = process.env.npm_execpath;
  if (!pnpmCli) throw new Error("Unable to locate the pnpm CLI.");

  const env = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    ...(process.env.VISUAL_REGRESSION
      ? { SEED_NOW: "2026-08-31T12:00:00.000Z" }
      : {}),
  };
  const runPnpm = (args: string[]) =>
    execFileSync(pnpmCli, args, { env, stdio: "inherit" });

  runPnpm(["db:deploy"]);
  runPnpm(["db:seed"]);
}
