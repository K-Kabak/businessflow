import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ClientTable } from "@/components/clients/client-table";

describe("ClientTable", () => {
  it("renders client data with a detail link", () => {
    render(
      <ClientTable
        clients={[
          {
            id: "client-1",
            name: "Northstar Studio",
            company: null,
            email: "hello@northstar.test",
            projectCount: 2,
            status: "ACTIVE",
            createdAt: "Sep 18, 2026",
          },
        ]}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Client" })).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Northstar Studio" }),
    ).toHaveAttribute("href", "/clients/client-1");
    expect(screen.getByText("hello@northstar.test")).toBeVisible();
    expect(screen.getByText("Active")).toBeVisible();
  });
});
