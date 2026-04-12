/** @vitest-environment jsdom */
import React from "react";
import { describe, it, beforeEach, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const TabsContext = React.createContext({ value: "all", onValueChange: (value: string) => {} });

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ value, onValueChange, children }: any) => (
    <TabsContext.Provider value={{ value, onValueChange }}>
      {children}
    </TabsContext.Provider>
  ),
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ value, children, ...props }: any) => {
    const ctx = React.useContext(TabsContext);
    return (
      <button
        {...props}
        role="tab"
        type="button"
        aria-selected={ctx.value === value}
        onClick={() => ctx.onValueChange(value)}>
        {children}
      </button>
    );
  },
}));

import AudiencesPage from "./page";

vi.mock("sonner", () => {
  const toast = vi.fn();
  toast.success = vi.fn();
  toast.error = vi.fn();
  return { toast };
});

describe("Audiences page", () => {
  const sampleAudiences = [
    {
      id: "aud-1",
      name: "Acme VIP Buyers",
      description: "High value repeat purchasers",
      status: "active",
      type: "custom",
      customerCount: 18,
      campaignsSent: 5,
      growthRate: 12,
      engagementRate: 54,
      lastCampaign: "Spring Sale",
      customerIds: [],
    },
    {
      id: "aud-2",
      name: "Dormant Subscribers",
      description: "Customers with no orders in 180 days",
      status: "inactive",
      type: "predefined",
      customerCount: 82,
      campaignsSent: 2,
      growthRate: -4,
      engagementRate: 22,
      lastCampaign: "November Re-engage",
      customerIds: [],
    },
  ];

  const sampleMetrics = {
    totalCustomers: 100,
    activeAudiences: 1,
    totalCampaigns: 7,
    avgGrowthRate: 3.5,
    totalCustomersChange: 0,
    activeAudiencesChange: 0,
    totalCampaignsChange: 0,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn((input: RequestInfo) => {
      if (typeof input === "string" && input.endsWith("/stats")) {
        return Promise.resolve({ ok: true, json: async () => sampleMetrics });
      }

      return Promise.resolve({ ok: true, json: async () => sampleAudiences });
    }) as any;
  });

  it("renders audience cards after fetching data", async () => {
    render(<AudiencesPage />);

    await waitFor(() => {
      expect(screen.getByText("Acme VIP Buyers")).toBeInTheDocument();
      expect(screen.getByText("Dormant Subscribers")).toBeInTheDocument();
    });
  });

  it("filters audiences with the search input", async () => {
    render(<AudiencesPage />);

    await waitFor(() => expect(screen.getByText("Acme VIP Buyers")).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText("Search audiences..."), {
      target: { value: "dormant" },
    });

    expect(screen.queryByText("Acme VIP Buyers")).not.toBeInTheDocument();
    expect(screen.getByText("Dormant Subscribers")).toBeInTheDocument();
  });

  it("shows only active audiences when Active filter is selected", async () => {
    render(<AudiencesPage />);

    await waitFor(() => expect(screen.getByText("Acme VIP Buyers")).toBeInTheDocument());

    const activeTab = screen.getByRole("tab", { name: "Active" });
    fireEvent.pointerDown(activeTab);
    fireEvent.click(activeTab);

    await waitFor(() => {
      expect(activeTab).toHaveAttribute("aria-selected", "true");
      expect(screen.getByText("Acme VIP Buyers")).toBeInTheDocument();
      expect(screen.queryByText("Dormant Subscribers")).not.toBeInTheDocument();
    });
  });
});
