/** @vitest-environment jsdom */
import { describe, it, beforeEach, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { toast } from "sonner";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    refresh: refreshMock,
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("sonner", () => {
  const toast = vi.fn();
  toast.success = vi.fn();
  toast.error = vi.fn();
  return { toast };
});

import AudienceForm from "./AudienceForm";

describe("AudienceForm", () => {
  const initialData = {
    id: "aud-1",
    name: "Acme VIP Buyers",
    description: "High value repeat purchasers",
    status: "active",
    type: "custom",
    field: "totalSpent",
    customerCount: 18,
    campaignsSent: 5,
    growthRate: 12,
    lastCampaign: "Spring Sale",
    engagementRate: 54,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    pushMock.mockClear();
    refreshMock.mockClear();
  });

  it("submits updated audience data and navigates back on success", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ id: initialData.id }),
      }),
    ) as any;

    render(<AudienceForm mode="edit" initialData={initialData} />);

    fireEvent.change(screen.getByLabelText(/Audience Name/i), {
      target: { value: "Acme VIP Loyal Customers" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/audience/aud-1",
        expect.objectContaining({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: expect.any(String),
        }),
      );
    });

    expect(pushMock).toHaveBeenCalledWith("/audiences");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows a validation error when the audience name is empty", async () => {
    global.fetch = vi.fn() as any;

    render(<AudienceForm mode="edit" initialData={initialData} />);

    fireEvent.change(screen.getByLabelText(/Audience Name/i), {
      target: { value: "" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Please enter an audience name");
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
