import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts.at(-1)![0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase() || "?";
};

const filterContacts = (contacts: any[], search: string, status: string) => {
  return contacts.filter((c) => {
    const matchSearch =
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase());

    const matchStatus = status === "All" || c.status === status;

    return matchSearch && matchStatus;
  });
};

//UNIT TESTS

describe("CONTACT UNIT TESTS", () => {
  it("getInitials works", () => {
    expect(getInitials("Sarah Lopez")).toBe("SL");
    expect(getInitials("David")).toBe("DA");
  });

  it("filters contacts by name", () => {
    const data = [
      { id: "1", name: "Sarah Lopez", email: "a", phone: "1", status: "Active" },
      { id: "2", name: "David Kim", email: "b", phone: "2", status: "Inactive" },
    ];

    const res = filterContacts(data, "Sarah", "All");
    expect(res).toHaveLength(1);
    expect(res[0].name).toBe("Sarah Lopez");
  });

  it("filters contacts by status", () => {
    const data = [
      { id: "1", name: "A", email: "a", phone: "1", status: "Active" },
      { id: "2", name: "B", email: "b", phone: "2", status: "Inactive" },
    ];

    const res = filterContacts(data, "", "Active");
    expect(res).toHaveLength(1);
    expect(res[0].status).toBe("Active");
  });
});


function TestContactApp() {
  const [contacts, setContacts] = React.useState([
    { id: "1", name: "Sarah Lopez", email: "a", phone: "1", status: "Active" },
    { id: "2", name: "David Kim", email: "b", phone: "2", status: "Inactive" },
  ]);

  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("All");

  const filtered = filterContacts(contacts, search, status);

  return (
    <div>
      <h1>Contacts</h1>

      <input
        placeholder="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <button onClick={() => setSearch("")}>Clear filters</button>

      <button
        onClick={() =>
          setContacts((prev) => prev.filter((c) => c.id !== "1"))
        }
      >
        Delete
      </button>

      <div>
        {filtered.map((c) => (
          <div key={c.id}>{c.name}</div>
        ))}
      </div>
    </div>
  );
}

//INTEGRATION TESTS

describe("CONTACT INTEGRATION TESTS", () => {
  beforeEach(() => {
    render(<TestContactApp />);
  });

  it("renders contacts", () => {
    expect(screen.getByText("Contacts")).toBeInTheDocument();
    expect(screen.getByText("Sarah Lopez")).toBeInTheDocument();
    expect(screen.getByText("David Kim")).toBeInTheDocument();
  });

  it("filters via search input", () => {
    fireEvent.change(screen.getByPlaceholderText("search"), {
      target: { value: "Sarah" },
    });

    expect(screen.getByText("Sarah Lopez")).toBeInTheDocument();
    expect(screen.queryByText("David Kim")).not.toBeInTheDocument();
  });

  it("clears filters", async () => {
    fireEvent.change(screen.getByPlaceholderText("search"), {
      target: { value: "Sarah" },
    });

    fireEvent.click(screen.getByText("Clear filters"));

    await waitFor(() => {
      expect(screen.getByText("Sarah Lopez")).toBeInTheDocument();
      expect(screen.getByText("David Kim")).toBeInTheDocument();
    });
  });

  it("deletes a contact", () => {
    fireEvent.click(screen.getByText("Delete"));

    expect(screen.queryByText("Sarah Lopez")).not.toBeInTheDocument();
  });
});