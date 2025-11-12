// app/forms/page.tsx
"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Plus,
  ScrollText,
  X,
  BadgeCheck,
  Eye,
  Inbox,
  FileText,
  Pencil,
  Share2,
  Trash2,
  TrendingUp,
  Copy as CopyIcon,
  LayoutGrid,
  Rows3,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
} from "lucide-react"
import MetricCard from "@/components/dashboard/MetricCard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import clsx from "clsx"

type FormStatus = "active" | "template" | "custom"
type FormRow = {
  id: string
  title: string
  description?: string
  status: FormStatus
  views: number
  submissions: number
  conversions: number
  updatedAt: string // ISO date
  changePct?: number
}

const MOCK_FORMS: FormRow[] = [
  { id: "1", title: "Wedding Inquiry", description: "Collect wedding details", status: "active", views: 312, submissions: 84, conversions: 62, updatedAt: "2025-10-20" },
  { id: "2", title: "Event Consultation", description: "Corporate/event intake", status: "template", views: 201, submissions: 41, conversions: 38, updatedAt: "2025-10-18" },
  { id: "3", title: "Funeral Arrangement", description: "Sympathy orders", status: "custom", views: 97, submissions: 22, conversions: 21, updatedAt: "2025-10-12" },
  { id: "4", title: "Birthday Request", description: "Occasion request", status: "active", views: 152, submissions: 54, conversions: 49, updatedAt: "2025-10-09" },
  { id: "5", title: "Anniversary Flowers", description: "Recurring reminder form", status: "active", views: 117, submissions: 40, conversions: 37, updatedAt: "2025-10-03" },
]

// ----- Small utilities -----
function useDebounced<T>(value: T, delay = 250) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

function shortId(id: string) {
  return id.length > 8 ? id.slice(0, 6) + "…" : id
}

function monthKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function monthLabel(isoYYYYMM: string) {
  const [y, m] = isoYYYYMM.split("-").map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" })
}

export default function Forms() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingForm, setEditingForm] = useState<FormRow | null>(null)
  const [forms, setForms] = useState(MOCK_FORMS)
  const [newFormTitle, setNewFormTitle] = useState("")
  const [newFormDescription, setNewFormDescription] = useState("")
  const [newFormStatus, setNewFormStatus] = useState<FormStatus>("active")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // ----- filters + search -----
  const TABS: { key: "active" | "template" | "custom" | "all"; label: string }[] = [
    { key: "active", label: "Active" },
    { key: "template", label: "Templates" },
    { key: "custom", label: "Custom" },
    { key: "all", label: "All" },
  ]
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all")
  const [query, setQuery] = useState("")
  const q = useDebounced(query, 200)

  // ----- NEW: view / sort / group / pagination -----
  type ViewMode = "grid" | "table"
  const [view, setView] = useState<ViewMode>("grid")

  type SortKey = "updated_desc" | "title_asc" | "views_desc" | "subs_desc" | "conv_desc"
  const [sortKey, setSortKey] = useState<SortKey>("updated_desc")

  type GroupKey = "none" | "status" | "month"
  const [groupKey, setGroupKey] = useState<GroupKey>("none")

  const [pageSize, setPageSize] = useState(12)
  const [page, setPage] = useState(1)

  // Delete
  const handleDeleteForm = (id: string) => {
    setForms(prevForms => prevForms.filter(f => f.id !== id))
  }

  // Create
  const handleCreateForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFormTitle.trim()) return

    const newForm: FormRow = {
      id: `form-${Date.now()}`,
      title: newFormTitle,
      description: newFormDescription || undefined,
      status: newFormStatus,
      views: 0,
      submissions: 0,
      conversions: 0,
      updatedAt: new Date().toISOString().split("T")[0],
    }

    setForms(prevForms => [newForm, ...prevForms])

    // Reset form and close modal
    setNewFormTitle("")
    setNewFormDescription("")
    setNewFormStatus("active")
    setModalOpen(false)
    setPage(1) // jump to first page where new item appears
  }

  // Edit modal
  const handleOpenEdit = (form: FormRow) => {
    setEditingForm(form)
    setEditModalOpen(true)
  }

  // Update
  const handleUpdateForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingForm) return

    const updatedForm: FormRow = {
      ...editingForm,
      updatedAt: new Date().toISOString().split("T")[0],
    }

    setForms(prevForms => prevForms.map(f => (f.id === editingForm.id ? updatedForm : f)))
    setEditModalOpen(false)
    setEditingForm(null)
  }

  // URL + Copy + Share helpers
  function formUrl(id: string) {
    if (typeof window === "undefined") return `/forms/${id}`
    return `${window.location.origin}/forms/${id}`
  }

  async function handleCopy(form: FormRow) {
    const url = formUrl(form.id)
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(form.id)
      toast.success("Link copied to clipboard!")
      setTimeout(() => setCopiedId(null), 1200)
    } catch {
      window.prompt("Copy form link:", url) // final fallback
    }
  }

  const handleShare = async (form: FormRow) => {
    const url = formUrl(form.id)
    if (navigator.share) {
      try {
        await navigator.share({
          title: form.title,
          text: `Check out this form: ${form.title}`,
          url,
        })
        toast.success("Form shared successfully!")
        return
      } catch {
        // user cancelled or failed; fall back to copy
      }
    }
    await handleCopy(form)
  }

  // counts for tabs
  const counts = useMemo(() => {
    const c = { active: 0, template: 0, custom: 0, all: forms.length }
    for (const f of forms) c[f.status]++
    return c
  }, [forms])

  // base filter
  const filtered = useMemo(() => {
    const base = tab === "all" ? forms : forms.filter(f => f.status === tab)
    if (!q.trim()) return base
    const needle = q.toLowerCase()
    return base.filter(
      f => f.title.toLowerCase().includes(needle) || (f.description ?? "").toLowerCase().includes(needle)
    )
  }, [tab, q, forms])

  // sort
  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      switch (sortKey) {
        case "updated_desc":
          return +new Date(b.updatedAt) - +new Date(a.updatedAt)
        case "title_asc":
          return a.title.localeCompare(b.title)
        case "views_desc":
          return b.views - a.views
        case "subs_desc":
          return b.submissions - a.submissions
        case "conv_desc": {
          const ac = a.views ? a.conversions / a.views : 0
          const bc = b.views ? b.conversions / b.views : 0
          return bc - ac
        }
        default:
          return 0
      }
    })
    return arr
  }, [filtered, sortKey])

  // group
  const grouped = useMemo(() => {
    if (groupKey === "none") return { "": sorted }
    const map: Record<string, FormRow[]> = {}
    for (const f of sorted) {
      const key = groupKey === "status" ? f.status : monthKey(f.updatedAt)
      if (!map[key]) map[key] = []
      map[key].push(f)
    }
    return map
  }, [sorted, groupKey])

  // pagination (applies after grouping = none; for grouped views we paginate within each group concatenated)
  const paged = useMemo(() => {
    const flatten = Object.entries(grouped)
      .sort(([a], [b]) => {
        if (groupKey === "status") {
          const order = ["active", "template", "custom"]
          return order.indexOf(a) - order.indexOf(b)
        }
        if (groupKey === "month") return b.localeCompare(a) // newest month first
        return 0
      })
      .flatMap(([_, items]) => items)

    const total = flatten.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * pageSize
    const chunk = flatten.slice(start, start + pageSize)

    // rebuild grouped view from chunk
    const map: Record<string, FormRow[]> = {}
    for (const f of chunk) {
      const key =
        groupKey === "status" ? f.status : groupKey === "month" ? monthKey(f.updatedAt) : ""
      if (!map[key]) map[key] = []
      map[key].push(f)
    }
    return { map, total, totalPages, page: safePage }
  }, [grouped, groupKey, pageSize, page])

  useEffect(() => {
    setPage(1) // reset page when filters/sorts/grouping change
  }, [tab, q, sortKey, groupKey, pageSize])

  // Dynamic metrics (from filtered list)
  const dynamicMetrics = useMemo(() => {
    const totalForms = filtered.length
    const activeForms = filtered.filter(f => f.status === "active").length
    const totalViews = filtered.reduce((sum, f) => sum + f.views, 0)
    const totalSubmissions = filtered.reduce((sum, f) => sum + f.submissions, 0)
    const totalConversions = filtered.reduce((sum, f) => sum + f.conversions, 0)
    const conversionRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0
    return { totalForms, activeForms, totalViews, totalSubmissions, totalConversions, conversionRate }
  }, [filtered])

  return (
    <div className="p-6 relative">
      {/* Top Panel */}
      <Card className="flex flex-row justify-between items-center p-6 bg-card">
        <div className="flex-1">
          <CardTitle className="text-2xl font-bold">Forms</CardTitle>
          <CardDescription>Create and share forms to collect valuable customer information</CardDescription>
        </div>

        <Button size="lg" className="flex items-center gap-2" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" /> Create Form
        </Button>
      </Card>

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-3/4 max-w-2xl p-6 relative">
            <Button size="sm" className="absolute top-4 right-4" onClick={() => setModalOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
            <CardTitle>Create a New Form</CardTitle>
            <CardDescription className="mb-4">Fill in the details for your new form</CardDescription>

            <form className="flex flex-col gap-4" onSubmit={handleCreateForm}>
              <div>
                <label className="text-sm font-medium mb-2 block">Form Title *</label>
                <input
                  type="text"
                  placeholder="Enter form title"
                  value={newFormTitle}
                  onChange={(e) => setNewFormTitle(e.target.value)}
                  className="border rounded-md p-2 w-full bg-background"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <textarea
                  placeholder="Enter form description (optional)"
                  value={newFormDescription}
                  onChange={(e) => setNewFormDescription(e.target.value)}
                  className="border rounded-md p-2 w-full bg-background"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={newFormStatus} onValueChange={(value) => setNewFormStatus(value as FormStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="template">Template</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 mt-2">
                <Button type="submit" className="flex-1" disabled={!newFormTitle.trim()}>
                  Save Form
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setModalOpen(false)
                    setNewFormTitle("")
                    setNewFormDescription("")
                    setNewFormStatus("active")
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && editingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-3/4 max-w-2xl p-6 relative">
            <Button
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => {
                setEditModalOpen(false)
                setEditingForm(null)
              }}
            >
              <X className="w-4 h-4" />
            </Button>
            <CardTitle>Edit Form</CardTitle>
            <CardDescription className="mb-4">Update the details for your form</CardDescription>

            <form className="flex flex-col gap-4" onSubmit={handleUpdateForm}>
              <div>
                <label className="text-sm font-medium mb-2 block">Form Title *</label>
                <input
                  type="text"
                  placeholder="Enter form title"
                  value={editingForm.title}
                  onChange={(e) => setEditingForm({ ...editingForm, title: e.target.value })}
                  className="border rounded-md p-2 w-full bg-background"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <textarea
                  placeholder="Enter form description (optional)"
                  value={editingForm.description || ""}
                  onChange={(e) => setEditingForm({ ...editingForm, description: e.target.value })}
                  className="border rounded-md p-2 w-full bg-background"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select
                  value={editingForm.status}
                  onValueChange={(value) => setEditingForm({ ...editingForm, status: value as FormStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="template">Template</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 mt-2">
                <Button type="submit" className="flex-1">
                  Update Form
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditModalOpen(false)
                    setEditingForm(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <main className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
        {/* Metric cards */}
        <section className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden mt-4">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 w-full">
            <MetricCard title="Total Forms" value={dynamicMetrics.totalForms} changePct={0} icon={ScrollText} />
            <MetricCard title="Active Forms" value={dynamicMetrics.activeForms} changePct={0} icon={BadgeCheck} />
            <MetricCard title="Total Views" value={dynamicMetrics.totalViews} changePct={0} icon={Eye} />
            <MetricCard title="Submissions" value={dynamicMetrics.totalSubmissions} changePct={0} icon={Inbox} />
            <MetricCard title="Conversions" value={`${dynamicMetrics.conversionRate.toFixed(1)}%`} changePct={0} icon={TrendingUp} />
          </section>

          {/* Tabs + Search + Controls */}
          <div className="w-full rounded-2xl border bg-card/50 border-border p-4 flex flex-col gap-3">
            {/* Tabs & search row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { key: "all", label: "All", count: counts.all },
                  { key: "active", label: "Active", count: counts.active },
                  { key: "template", label: "Templates", count: counts.template },
                  { key: "custom", label: "Custom", count: counts.custom },
                ].map((t) => {
                  const active = tab === (t.key as typeof tab)
                  return (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key as typeof tab)}
                      className={clsx(
                        "px-4 py-2 text-sm font-medium transition-all relative rounded-full border",
                        active
                          ? "text-primary border-primary/40 bg-primary/10"
                          : "text-muted-foreground hover:text-foreground border-border"
                      )}
                    >
                      {t.label}
                      <span className="ml-2 text-xs opacity-70">({t.count})</span>
                    </button>
                  )
                })}
              </div>

              <div className="relative w-full sm:w-80">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search forms..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 pr-9 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
                <svg
                  aria-hidden
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
            </div>

            {/* Control bar */}
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant={view === "grid" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setView("grid")}
                  className="gap-1"
                >
                  <LayoutGrid className="h-4 w-4" /> Grid
                </Button>
                <Button
                  variant={view === "table" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setView("table")}
                  className="gap-1"
                >
                  <Rows3 className="h-4 w-4" /> Table
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 opacity-70" />
                  <span className="text-sm text-muted-foreground">Group by</span>
                </div>
                <Select value={groupKey} onValueChange={(v) => setGroupKey(v as any)}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2 ml-2">
                  <ArrowUpDown className="h-4 w-4 opacity-70" />
                  <span className="text-sm text-muted-foreground">Sort</span>
                </div>
                <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="Updated (newest)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updated_desc">Updated (newest)</SelectItem>
                    <SelectItem value="title_asc">Title (A–Z)</SelectItem>
                    <SelectItem value="views_desc">Views (high→low)</SelectItem>
                    <SelectItem value="subs_desc">Submissions (high→low)</SelectItem>
                    <SelectItem value="conv_desc">Conversion (high→low)</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger className="w-[110px] ml-2"><SelectValue placeholder="Page size" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8">8 / page</SelectItem>
                    <SelectItem value="12">12 / page</SelectItem>
                    <SelectItem value="24">24 / page</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={paged.page <= 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <div className="text-sm text-muted-foreground">
                  Page <span className="font-medium text-foreground">{paged.page}</span> of{" "}
                  <span className="font-medium text-foreground">{paged.totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(paged.totalPages, p + 1))}
                  disabled={paged.page >= paged.totalPages}
                  className="gap-1"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Main content */}
          {view === "grid" ? (
            // GRID VIEW, grouped
            <section className="space-y-6">
              {Object.entries(paged.map).map(([group, items]) => (
                <div key={group || "all"}>
                  {groupKey !== "none" && (
                    <div className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
                      {groupKey === "status" ? group : monthLabel(group)}
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {items.map((f) => (
                      <Card key={f.id} className="p-4 flex flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 opacity-70" />
                              <h3 className="font-semibold truncate">{f.title}</h3>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                #{shortId(f.id)}
                              </span>
                            </div>
                            {f.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{f.description}</p>
                            )}
                          </div>
                          <span
                            className={clsx(
                              "text-xs px-2 py-1 rounded-full border",
                              f.status === "active"
                                ? "bg-emerald-50/60 dark:bg-emerald-500/10 border-emerald-300 text-emerald-700 dark:text-emerald-300"
                                : f.status === "template"
                                ? "bg-blue-50/60 dark:bg-blue-500/10 border-blue-300 text-blue-700 dark:text-blue-300"
                                : "bg-amber-50/60 dark:bg-amber-500/10 border-amber-300 text-amber-700 dark:text-amber-300"
                            )}
                          >
                            {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                          <div className="rounded-xl border border-border p-3">
                            <div className="text-xs text-muted-foreground">Views</div>
                            <div className="font-semibold">{f.views.toLocaleString()}</div>
                          </div>
                          <div className="rounded-xl border border-border p-3">
                            <div className="text-xs text-muted-foreground">Submissions</div>
                            <div className="font-semibold">{f.submissions.toLocaleString()}</div>
                          </div>
                          <div className="rounded-xl border border-border p-3">
                            <div className="text-xs text-muted-foreground">Conversion</div>
                            <div className="font-semibold">
                              {f.views > 0 ? ((f.conversions / f.views) * 100).toFixed(1) : 0}%
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 text-xs text-muted-foreground">
                          Updated {new Date(f.updatedAt).toLocaleDateString()}
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <Button className="flex-1" variant="secondary" onClick={() => handleOpenEdit(f)}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit
                          </Button>

                          {/* Copy */}
                          <Button
                            variant="outline"
                            className="px-3"
                            onClick={() => handleCopy(f)}
                            aria-label="Copy link"
                            title="Copy link"
                          >
                            {copiedId === f.id ? (
                              <span className="text-xs font-medium">Copied</span>
                            ) : (
                              <CopyIcon className="h-4 w-4" />
                            )}
                          </Button>

                          {/* Share */}
                          <Button
                            variant="outline"
                            className="px-3"
                            onClick={() => handleShare(f)}
                            aria-label="Share form"
                            title="Share"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>

                          {/* Delete */}
                          <Button
                            variant="ghost"
                            className="px-3 text-destructive hover:text-destructive"
                            title="Delete"
                            onClick={() => handleDeleteForm(f.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ) : (
            // TABLE VIEW, grouped headers + sticky table
            <div className="rounded-2xl border border-border overflow-hidden">
              <div className="max-w-full overflow-x-auto">
                {Object.entries(paged.map).map(([group, items]) => (
                  <div key={group || "all"}>
                    {groupKey !== "none" && (
                      <div className="px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground bg-muted/40">
                        {groupKey === "status" ? group : monthLabel(group)}
                      </div>
                    )}

                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0 z-10">
                        <tr className="[&>th]:py-3 [&>th]:px-4 text-left">
                          <th className="w-[28%]">Title</th>
                          <th className="w-[10%]">Status</th>
                          <th className="w-[10%] text-right">Views</th>
                          <th className="w-[12%] text-right">Submissions</th>
                          <th className="w-[12%] text-right">Conversion</th>
                          <th className="w-[14%]">Updated</th>
                          <th className="w-[14%] text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="[&>tr]:border-t [&>tr]:border-border">
                        {items.map((f) => {
                          const conv = f.views ? (f.conversions / f.views) * 100 : 0
                          return (
                            <tr key={f.id} className="hover:bg-muted/30">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 opacity-70" />
                                  <div className="min-w-0">
                                    <div className="font-medium truncate">{f.title}</div>
                                    <div className="text-xs text-muted-foreground truncate">
                                      #{shortId(f.id)} {f.description ? "• " + f.description : ""}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={clsx(
                                    "text-xs px-2 py-1 rounded-full border",
                                    f.status === "active"
                                      ? "bg-emerald-50/60 dark:bg-emerald-500/10 border-emerald-300 text-emerald-700 dark:text-emerald-300"
                                      : f.status === "template"
                                      ? "bg-blue-50/60 dark:bg-blue-500/10 border-blue-300 text-blue-700 dark:text-blue-300"
                                      : "bg-amber-50/60 dark:bg-amber-500/10 border-amber-300 text-amber-700 dark:text-amber-300"
                                  )}
                                >
                                  {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">{f.views.toLocaleString()}</td>
                              <td className="py-3 px-4 text-right">{f.submissions.toLocaleString()}</td>
                              <td className="py-3 px-4 text-right">{conv.toFixed(1)}%</td>
                              <td className="py-3 px-4">{new Date(f.updatedAt).toLocaleDateString()}</td>
                              <td className="py-3 px-4">
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(f)}>
                                    <Pencil className="h-4 w-4 mr-2" /> Edit
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleCopy(f)} title="Copy link">
                                    {copiedId === f.id ? (
                                      <span className="text-xs font-medium">Copied</span>
                                    ) : (
                                      <CopyIcon className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleShare(f)} title="Share">
                                    <Share2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteForm(f.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
