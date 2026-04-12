/** @vitest-environment jsdom */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

import AudienceCard from "./AudienceCard";

describe("AudienceCard", () => {
  it("renders the audience name, description, and status badge", () => {
    render(
      <AudienceCard
        id="aud-1"
        name="Acme VIP Buyers"
        description="High value repeat purchasers"
        status="active"
        type="custom"
        customerCount={18}
        campaignsSent={5}
        growthRate={12}
        engagementRate={54}
        lastCampaign="Spring Sale"
      />,
    );

    expect(screen.getByText("Acme VIP Buyers")).toBeInTheDocument();
    expect(screen.getByText("High value repeat purchasers")).toBeInTheDocument();
    expect(screen.getByText(/active/i)).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("+12%")).toBeInTheDocument();
    expect(screen.getByText("54%")).toBeInTheDocument();
    expect(screen.getByText("Spring Sale")).toBeInTheDocument();
  });

  it("navigates when action buttons are clicked", () => {
    render(
      <AudienceCard
        id="aud-1"
        name="Acme VIP Buyers"
        description="High value repeat purchasers"
        status="active"
        type="custom"
        customerCount={18}
        campaignsSent={5}
        growthRate={12}
        engagementRate={54}
        lastCampaign="Spring Sale"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /View Details/i }));
    expect(pushMock).toHaveBeenCalledWith("/audiences/aud-1/customers");

    fireEvent.click(screen.getByTitle("View email campaign details"));
    expect(pushMock).toHaveBeenCalledWith("/audiences/aud-1/campaigns");
  });
});
