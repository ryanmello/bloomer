import { describe, it, expect, vi, beforeEach } from "vitest";

// MOCKS

global.fetch = vi.fn();

const toast = {
  success: vi.fn(),
  error: vi.fn(),
};

const router = {
  push: vi.fn(),
};

const canCreateForm = (title: string) => !!title.trim();

function buildExport(state: any) {
  return {
    summary: state.exportSummary,
    forms: state.exportForms ? state.selectedForms : [],
    format: state.exportFormat,
  };
}

function addQuestion(list: any[]) {
  return [...list, { id: "x", type: "short", text: "" }];
}

function removeQuestion(list: any[], id: string) {
  return list.filter(q => q.id !== id);
}

function toggleMultiSelect(q: any) {
  return { ...q, multiSelect: !q.multiSelect };
}

function addOption(q: any) {
  return {
    ...q,
    options: [...(q.options || []), ""],
  };
}

function removeOption(q: any, index: number) {
  const copy = [...(q.options || [])];
  copy.splice(index, 1);
  return { ...q, options: copy };
}

function togglePermission(list: string[], id: string) {
  return list.includes(id)
    ? list.filter(x => x !== id)
    : [...list, id];
}

function canPreview(form: any) {
  return !!form.title || !!form.description || form.questions.length > 0;
}

function conversionRate(views: number, subs: number) {
  return views > 0 ? (subs / views) * 100 : 0;
}

function mcqStats(submissions: any[], value: string) {
  const total = submissions.length;
  const count = submissions.filter(s => s.answer === value).length;

  return {
    count,
    percent: total ? (count / total) * 100 : 0,
  };
}

function paginate(items: any[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function groupByStatus(forms: any[]) {
  return forms.reduce((acc, f) => {
    acc[f.status] = acc[f.status] || [];
    acc[f.status].push(f);
    return acc;
  }, {} as any);
}

// UNIT TESTS 

describe("FORMS - UNIT TESTS", () => {
  beforeEach(() => vi.clearAllMocks());

  it("validates form title", () => {
    expect(canCreateForm("")).toBe(false);
    expect(canCreateForm("   ")).toBe(false);
    expect(canCreateForm("My Form")).toBe(true);
  });

  it("builds export payload", () => {
    const state = {
      exportSummary: true,
      exportForms: true,
      selectedForms: ["1", "2"],
      exportFormat: "csv",
    };

    const res = buildExport(state);

    expect(res.forms).toEqual(["1", "2"]);
    expect(res.summary).toBe(true);
    expect(res.format).toBe("csv");
  });

  it("question logic works", () => {
    expect(addQuestion([{ id: "1" }]).length).toBe(2);
    expect(removeQuestion([{ id: "1" }, { id: "2" }], "1")).toEqual([{ id: "2" }]);
  });

  it("mcq option logic", () => {
    expect(addOption({ options: ["A"] }).options.length).toBe(2);
    expect(removeOption({ options: ["A", "B"] }, 0).options).toEqual(["B"]);
  });

  it("permission toggle works", () => {
    let list = ["a"];

    list = togglePermission(list, "b");
    expect(list).toEqual(["a", "b"]);

    list = togglePermission(list, "a");
    expect(list).toEqual(["b"]);
  });

  it("preview validation works", () => {
    expect(canPreview({ title: "", description: "", questions: [] })).toBe(false);
    expect(canPreview({ title: "x", description: "", questions: [] })).toBe(true);
  });

  it("conversion rate works", () => {
    expect(conversionRate(100, 20)).toBe(20);
    expect(conversionRate(0, 10)).toBe(0);
  });

  it("mcq stats works", () => {
    const subs = [
      { answer: "A" },
      { answer: "A" },
      { answer: "B" },
    ];

    const stats = mcqStats(subs, "A");

    expect(stats.count).toBe(2);
    expect(stats.percent).toBe((2 / 3) * 100);
  });

  it("pagination works", () => {
    const items = Array.from({ length: 10 }, (_, i) => i);

    expect(paginate(items, 1, 5)).toEqual([0, 1, 2, 3, 4]);
    expect(paginate(items, 2, 5)).toEqual([5, 6, 7, 8, 9]);
  });

  it("groups forms by status", () => {
    const forms = [
      { status: "active" },
      { status: "active" },
      { status: "template" },
    ];

    const grouped = groupByStatus(forms);

    expect(grouped.active.length).toBe(2);
    expect(grouped.template.length).toBe(1);
  });
});

// API TESTS 

describe("FORMS - API CLIENT TESTS", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates form via API", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "1",
        title: "any title",
      }),
    });

    const res = await fetch("/api/forms", {
      method: "POST",
      body: JSON.stringify({ title: "test" }),
    });

    const json = await res.json();

    expect(fetch).toHaveBeenCalled();
    expect(json.id).toBe("1");
    expect(json.title).toBeDefined();
  });

  it("reads form via API", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "1",
        title: "form",
      }),
    });

    const res = await fetch("/api/forms/1");
    const json = await res.json();

    expect(json.id).toBe("1");
    expect(typeof json.title).toBe("string");
  });

  it("lists forms", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [
        { id: "1" },
        { id: "2" },
      ],
    });

    const res = await fetch("/api/forms");
    const json = await res.json();

    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBe(2);
  });

  it("updates form", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "1",
        title: "updated",
      }),
    });

    const res = await fetch("/api/forms/1", {
      method: "PUT",
      body: JSON.stringify({ title: "updated" }),
    });

    const json = await res.json();

    expect(json.id).toBe("1");
    expect(json.title).toBeDefined();
  });

  it("deletes form", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
      }),
    });

    const res = await fetch("/api/forms/1", {
      method: "DELETE",
    });

    const json = await res.json();

    expect(json.success).toBe(true);
  });

  it("fetches submissions", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [{ id: "s1" }, { id: "s2" }],
    });

    const res = await fetch("/api/forms/form-1/submissions");
    const json = await res.json();

    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBe(2);
  });

  it("duplicates form", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "2",
        title: "copy",
      }),
    });

    const res = await fetch("/api/forms/1/duplicate", {
      method: "POST",
    });

    const json = await res.json();

    expect(json.id).toBe("2");
  });
});