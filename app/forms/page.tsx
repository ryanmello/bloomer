// app/forms/page.tsx
"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ScrollText, X, BadgeCheck, Eye, Inbox, FileText, Pencil, Share2, Trash2, TrendingUp } from "lucide-react"
import Link from "next/link"
import MetricCard from "@/components/dashboard/MetricCard"

type FormStatus = "active" | "template" | "custom"
type FormRow = {
  id: string
  title: string
  description?: string
  status: FormStatus
  views: number
  submissions: number
  conversions: number
  updatedAt: string
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

export default function Forms() {
  const [modalOpen, setModalOpen] = useState(false)

  // ----- NEW: filters + search -----
  const TABS: { key: "active" | "template" | "custom" | "all"; label: string }[] = [
    { key: "active", label: "Active" },
    { key: "template", label: "Templates" },
    { key: "custom", label: "Custom" },
    { key: "all", label: "All" },
  ]
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all")
  const [query, setQuery] = useState("")
  const q = useDebounced(query, 200)

  const counts = useMemo(() => {
    const c = { active: 0, template: 0, custom: 0, all: MOCK_FORMS.length }
    for (const f of MOCK_FORMS) c[f.status]++
    return c
  }, [])

  const filtered = useMemo(() => {
    const base = tab === "all" ? MOCK_FORMS : MOCK_FORMS.filter(f => f.status === tab)
    if (!q.trim()) return base
    const needle = q.toLowerCase()
    return base.filter(f =>
      f.title.toLowerCase().includes(needle) ||
      (f.description ?? "").toLowerCase().includes(needle)
    )
  }, [tab, q])

  // Calculate dynamic metrics based on filtered data
  const dynamicMetrics = useMemo(() => {
    const totalForms = filtered.length
    const activeForms = filtered.filter(f => f.status === "active").length
    const totalViews = filtered.reduce((sum, f) => sum + f.views, 0)
    const totalSubmissions = filtered.reduce((sum, f) => sum + f.submissions, 0)
    const totalConversions = filtered.reduce((sum, f) => sum + f.conversions, 0)
    
    // Calculate conversion rate as a percentage
    const conversionRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0
    
    return {
      totalForms,
      activeForms,
      totalViews,
      totalSubmissions,
      totalConversions,
      conversionRate
    }
  }, [filtered])

  return (
    <div className="p-6 relative">
      {/* Full-width Forms Panel */}
      <Card className="flex flex-row justify-between items-center p-6 bg-card">
        <div className="flex-1">
          <CardTitle className="text-2xl font-bold">Forms</CardTitle>
          <CardDescription>Create and share forms to collect valuable customer information</CardDescription>
        </div>

        <Button size="lg" className="flex items-center gap-2" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" /> Create Form
        </Button>
      </Card>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-3/4 max-w-2xl p-6 relative">
            <Button size="sm" className="absolute top-4 right-4" onClick={() => setModalOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
            <CardTitle>Create a New Form</CardTitle>
            <CardDescription className="mb-4">Fill in the details for your new form</CardDescription>

            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                setModalOpen(false)
              }}
            >
              <input type="text" placeholder="Form Title" className="border rounded-md p-2 w-full bg-background" />
              <textarea placeholder="Form Description" className="border rounded-md p-2 w-full bg-background" />
              <Button type="submit" className="mt-2">
                Save Form
              </Button>
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

          {/* ----- NEW: Tab + Search bar (the header row from your screenshot) ----- */}
          <div className="w-full rounded-2xl border bg-card/50 border-border p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              {TABS.map((t) => {
                const active = tab === t.key
                const count =
                  t.key === "all"
                    ? counts.all
                    : t.key === "active"
                    ? counts.active
                    : t.key === "template"
                    ? counts.template
                    : counts.custom
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={[
                      "px-4 py-2 text-sm font-medium transition-all relative",
                      active
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    ].join(" ")}
                  >
                    {t.label}
                    <span className="ml-2 text-xs opacity-70">({count})</span>
                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Search */}
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

          {/* ----- Forms grid (filtered) ----- */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((f) => (
              <Card key={f.id} className="p-4 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 opacity-70" />
                      <h3 className="font-semibold truncate">{f.title}</h3>
                    </div>
                    {f.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{f.description}</p>
                    )}
                  </div>
                  <span
                    className={[
                      "text-xs px-2 py-1 rounded-full border",
                      f.status === "active"
                        ? "bg-emerald-50/60 dark:bg-emerald-500/10 border-emerald-300 text-emerald-700 dark:text-emerald-300"
                        : f.status === "template"
                        ? "bg-blue-50/60 dark:bg-blue-500/10 border-blue-300 text-blue-700 dark:text-blue-300"
                        : "bg-amber-50/60 dark:bg-amber-500/10 border-amber-300 text-amber-700 dark:text-amber-300",
                    ].join(" ")}
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

                <div className="mt-4 flex items-center gap-2">
                  <Link href={`/forms/${f.id}`} className="flex-1">
                    <Button className="w-full" variant="secondary">
                      <Pencil className="h-4 w-4 mr-2" /> Edit
                    </Button>
                  </Link>
                  <Button variant="outline" className="px-3">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" className="px-3 text-destructive hover:text-destructive" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}

            {filtered.length === 0 && (
              <Card className="p-8 col-span-full text-center text-sm text-muted-foreground">
                No forms match your filters.
              </Card>
            )}
          </section>
        </section>
      </main>
    </div>
  )
}
