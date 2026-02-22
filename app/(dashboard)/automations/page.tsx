"use client";

import { useMemo, useState, useEffect } from 'react';
import { Card, CardTitle, CardHeader, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreateAutomationModal } from '@/components/automations/CreateAutomationsModal';
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
  Zap,
  Clock,
  Calendar,
  Send,
  Pause,
  Play,
  Copy,
  Files,
  User,
} from 'lucide-react';
import MetricCard from "@/components/dashboard/MetricCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import clsx from 'clsx';
import { toast } from "sonner"

type AutomationStatus = "active" | "paused" | "template" | "custom"
type AutomationCategory = "lifecycle" | "marketing" | "transactional" | "other"

// Database model type
type AutomationDB = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  category: string;
  triggerType: string;
  timing: number;
  actionType: string;
  createdAt: string;
  updatedAt: string;
  shopId: string;
  audienceId?: string | null;
  audience?: {
    id: string;
    name: string;
  } | null;
}

// UI display type (extends DB with computed/placeholder fields)
type AutomationRow = {
  id: string;
  title: string;
  description?: string;
  status: AutomationStatus;
  category: AutomationCategory;
  triggerType: string;
  timing: number;
  actionType: string;
  audienceId?: string | null;
  audienceName?: string | null;
  // Placeholder metrics
  triggers: number;
  submissions: number;
  opened: number;
  conversions: number;
  conversionRate: number;
  updatedAt: string;
}

// Convert DB model to UI row
function toAutomationRow(db: AutomationDB): AutomationRow {
  return {
    id: db.id,
    title: db.name,
    description: db.description || undefined,
    status: db.status as AutomationStatus,
    category: db.category as AutomationCategory,
    triggerType: db.triggerType,
    timing: db.timing,
    actionType: db.actionType,
    audienceId: db.audienceId,
    audienceName: db.audience?.name || null,
    triggers: 0,
    submissions: 0,
    opened: 0,
    conversions: 0,
    conversionRate: 0,
    updatedAt: db.updatedAt,
  };
}

// -- small utilities -- 
function useDebounced<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
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

export default function AutomationsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingAutomation, setEditingAutomation] = useState<AutomationRow | null>(null)
  const [automations, setAutomations] = useState<AutomationRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch automations from API
  const fetchAutomations = async () => {
    try {
      const response = await fetch('/api/automation');
      if (response.ok) {
        const data: AutomationDB[] = await response.json();
        setAutomations(data.map(toAutomationRow));
      }
    } catch (error) {
      console.error('Error fetching automations:', error);
      toast.error('Failed to load automations');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchAutomations();
  }, []);

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

  type SortKey = "updated_desc" | "title_asc" | "triggers_desc" | "subs_desc" | "conv_desc"
  const [sortKey, setSortKey] = useState<SortKey>("updated_desc")

  type GroupKey = "none" | "status" | "month"
  const [groupKey, setGroupKey] = useState<GroupKey>("none")

  const [pageSize, setPageSize] = useState(12)
  const [page, setPage] = useState(1)

  // Delete
  const handleDeleteAutomation = async (id: string) => {
    if (confirm("Are you sure you want to delete this automation?")) {
      try {
        const response = await fetch(`/api/automation/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setAutomations(prevAutomations => prevAutomations.filter(a => a.id !== id));
          toast.success("Automation deleted successfully");
        } else {
          toast.error("Failed to delete automation");
        }
      } catch (error) {
        console.error('Error deleting automation:', error);
        toast.error("Failed to delete automation");
      }
    }
  }

  // Pause/Resume
  const handleTogglePause = async (id: string) => {
    const automation = automations.find(a => a.id === id);
    if (!automation) return;

    const newStatus = automation.status === 'paused' ? 'active' : 'paused';

    try {
      const response = await fetch(`/api/automation/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setAutomations(prevAutomations =>
          prevAutomations.map(a =>
            a.id === id ? { ...a, status: newStatus as AutomationStatus } : a
          )
        );
        toast.success(newStatus === 'paused' ? "Automation paused" : "Automation resumed");
      } else {
        toast.error("Failed to update automation");
      }
    } catch (error) {
      console.error('Error toggling pause:', error);
      toast.error("Failed to update automation");
    }
  }

  // Duplicate
  const handleDuplicateAutomation = async (automation: AutomationRow) => {
    try {
      const response = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${automation.title} (Copy)`,
          description: automation.description,
          category: automation.category,
          triggerType: automation.triggerType,
          timing: automation.timing,
          actionType: automation.actionType,
          audienceId: automation.audienceId,
          status: 'active',
        }),
      });

      if (response.ok) {
        const newAutomation: AutomationDB = await response.json();
        setAutomations(prevAutomations => [toAutomationRow(newAutomation), ...prevAutomations]);
        toast.success("Automation duplicated successfully");
      } else {
        toast.error("Failed to duplicate automation");
      }
    } catch (error) {
      console.error('Error duplicating automation:', error);
      toast.error("Failed to duplicate automation");
    }
  }

  // Copy link
  function automationUrl(id: string) {
    if (typeof window === "undefined") return `/automations/${id}`
    return `${window.location.origin}/automations/${id}`
  }

  async function handleCopy(automation: AutomationRow) {
    const url = automationUrl(automation.id)
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(automation.id)
      toast.success("Link copied to clipboard!")
      setTimeout(() => setCopiedId(null), 1200)
    } catch {
      window.prompt("Copy automation link:", url) // final fallback
    }
  }

  // Edit modal
  const handleOpenEdit = (automation: AutomationRow) => {
    setEditingAutomation(automation)
    setEditModalOpen(true)
  }

  // Update
  const handleUpdateAutomation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAutomation) return

    try {
      const response = await fetch(`/api/automation/${editingAutomation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingAutomation.title,
          description: editingAutomation.description,
          category: editingAutomation.category,
          status: editingAutomation.status,
          timing: editingAutomation.timing,
          triggerType: editingAutomation.triggerType,
          actionType: editingAutomation.actionType,
        }),
      });

      if (response.ok) {
        const updated: AutomationDB = await response.json();
        setAutomations(prevAutomations =>
          prevAutomations.map(a => (a.id === editingAutomation.id ? toAutomationRow(updated) : a))
        );
        setEditModalOpen(false);
        setEditingAutomation(null);
        toast.success("Automation updated successfully");
      } else {
        toast.error("Failed to update automation");
      }
    } catch (error) {
      console.error('Error updating automation:', error);
      toast.error("Failed to update automation");
    }
  }

  // counts for tabs
  const counts = useMemo(() => {
    const c: Record<string, number> = { active: 0, template: 0, custom: 0, paused: 0, all: automations.length }
    for (const a of automations) {
      if (c[a.status] !== undefined) c[a.status]++
    }
    return c
  }, [automations])

  // base filter
  const filtered = useMemo(() => {
    const base = tab === "all" ? automations : automations.filter(a => a.status === tab)
    if (!q.trim()) return base
    const needle = q.toLowerCase()
    return base.filter(
      a => a.title.toLowerCase().includes(needle) || (a.description ?? "").toLowerCase().includes(needle)
    )
  }, [tab, q, automations])

  // sort
  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      switch (sortKey) {
        case "updated_desc":
          return +new Date(b.updatedAt) - +new Date(a.updatedAt)
        case "title_asc":
          return a.title.localeCompare(b.title)
        case "triggers_desc":
          return b.triggers - a.triggers
        case "subs_desc":
          return b.submissions - a.submissions
        case "conv_desc":
          return b.conversionRate - a.conversionRate
        default:
          return 0
      }
    })
    return arr
  }, [filtered, sortKey])

  // group
  const grouped = useMemo(() => {
    if (groupKey === "none") return { "": sorted }
    const map: Record<string, AutomationRow[]> = {}
    for (const a of sorted) {
      const key = groupKey === "status" ? a.status : monthKey(a.updatedAt)
      if (!map[key]) map[key] = []
      map[key].push(a)
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
    const map: Record<string, AutomationRow[]> = {}
    for (const a of chunk) {
      const key =
        groupKey === "status" ? a.status : groupKey === "month" ? monthKey(a.updatedAt) : ""
      if (!map[key]) map[key] = []
      map[key].push(a)
    }
    return { map, total, totalPages, page: safePage }
  }, [grouped, groupKey, pageSize, page])

  useEffect(() => {
    setPage(1) // reset page when filters/sorts/grouping change
  }, [tab, q, sortKey, groupKey, pageSize])

  // Dynamic metrics (from filtered list)
  const dynamicMetrics = useMemo(() => {
    const totalAutomations = automations.length
    const activeAutomations = automations.filter(a => a.status === "active").length
    const totalTriggered = automations.reduce((sum, a) => sum + a.triggers, 0)
    const totalSubmissions = automations.reduce((sum, a) => sum + a.submissions, 0)
    const totalConversions = automations.reduce((sum, a) => sum + a.conversions, 0)
    return { totalAutomations, activeAutomations, totalTriggered, totalSubmissions, totalConversions }
  }, [automations])

  return (
    <div className="p-6 relative">
      {/* Top Panel */}
      <Card className="flex flex-row justify-between items-center p-6 bg-card">
        <div className="flex-1">
          <CardTitle className="text-2xl font-bold">Automations</CardTitle>
          <CardDescription>Create automated workflows for customer communication and follow-ups</CardDescription>
        </div>

        <Button size="lg" className="flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" /> Create Automation
        </Button>
      </Card>

      <main className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
        {/* Metric cards */}
        <section className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden mt-4">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 w-full">
            <MetricCard title="Total Automations" value={dynamicMetrics.totalAutomations} changePct={0} icon={Zap} />
            <MetricCard title="Active" value={dynamicMetrics.activeAutomations} changePct={0} icon={BadgeCheck} />
            <MetricCard title="Total Triggered" value={dynamicMetrics.totalTriggered} changePct={0} icon={Inbox} />
            <MetricCard title="Submissions" value={dynamicMetrics.totalSubmissions} changePct={0} icon={FileText} />
            <MetricCard title="Conversions" value={dynamicMetrics.totalConversions} changePct={0} icon={TrendingUp} />
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
                  placeholder="Search automations..."
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
                    <SelectItem value="triggers_desc">Triggers (high→low)</SelectItem>
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Loading automations...</p>
              </div>
            </div>
          ) : view === "grid" ? (
            // GRID VIEW, grouped
            <section className="space-y-6">
              {Object.entries(paged.map).map(([group, items]) => (
                <div key={group || "all"}>
                  {groupKey !== "none" && (
                    <div className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
                      {groupKey === "status" ? group : monthLabel(group)}
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                    {items.map((a) => {
                      const categoryLabels: Record<AutomationCategory, string> = {
                        lifecycle: "Lifecycle",
                        marketing: "Marketing",
                        transactional: "Transactional",
                        other: "Other"
                      }
                      return (
                        <Card key={a.id} className="p-6 flex flex-col hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-4">
                            {/* Left side: Icon, Title, Badges, Description, Timing */}
                            <div className="flex-1">
                              <div className="flex items-start gap-3 mb-3">
                                <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                                  <Zap className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <h3 className="font-semibold text-lg">{a.title}</h3>
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {categoryLabels[a.category]}
                                      </span>
                                      <span className={clsx(
                                        "px-2 py-1 text-xs font-medium rounded-full",
                                        a.status === "active"
                                          ? "bg-emerald-100 text-emerald-700"
                                          : a.status === "template"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-amber-100 text-amber-700"
                                      )}>
                                        {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                                      </span>
                                    </div>
                                  </div>
                                  {a.description && (
                                    <p className="text-sm text-gray-600 mb-4">{a.description}</p>
                                  )}

                                  {/* Timing and Action info */}
                                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      <span>{a.timing} days</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-4 h-4" />
                                      <span>{a.triggerType.replace('_', ' ')}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Send className="w-4 h-4" />
                                      <span>{a.actionType.replace('_', ' ')}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <User className="w-4 h-4" />
                                      <span>{a.audienceName || 'All Customers'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Right side: Metrics and Actions */}
                            <div className="flex flex-col items-end gap-4">
                              {/* Performance Metrics */}
                              <div className="flex items-center gap-4">
                                <div className="text-center">
                                  <div className="text-lg font-bold">{a.triggers}</div>
                                  <div className="text-xs text-gray-500">Triggered</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold">{a.submissions}</div>
                                  <div className="text-xs text-gray-500">Sent</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold">{a.opened}</div>
                                  <div className="text-xs text-gray-500">Opened</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-green-600">{a.conversions}</div>
                                  <div className="text-xs text-gray-500">Conversions</div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleTogglePause(a.id)}
                                  title={a.status === 'paused' ? "Resume" : "Pause"}
                                >
                                  {a.status === 'paused' ? (
                                    <Play className="h-4 w-4" />
                                  ) : (
                                    <Pause className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleOpenEdit(a)}
                                  title="Edit"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleCopy(a)}
                                  title="Copy link"
                                >
                                  {copiedId === a.id ? (
                                    <span className="text-xs font-medium">Copied</span>
                                  ) : (
                                    <CopyIcon className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleDuplicateAutomation(a)}
                                  title="Duplicate"
                                >
                                  <Files className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteAutomation(a.id)}
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
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
                          <th className="w-[10%] text-right">Triggered</th>
                          <th className="w-[12%] text-right">Sent</th>
                          <th className="w-[12%] text-right">Conversions</th>
                          <th className="w-[14%]">Updated</th>
                          <th className="w-[14%] text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="[&>tr]:border-t [&>tr]:border-border">
                        {items.map((a) => {
                          return (
                            <tr key={a.id} className="hover:bg-muted/30">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Zap className="h-4 w-4 opacity-70" />
                                  <div className="min-w-0">
                                    <div className="font-medium truncate">{a.title}</div>
                                    <div className="text-xs text-muted-foreground truncate">
                                      #{shortId(a.id)} {a.description ? "• " + a.description : ""}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={clsx(
                                    "text-xs px-2 py-1 rounded-full border",
                                    a.status === "active"
                                      ? "bg-emerald-50/60 dark:bg-emerald-500/10 border-emerald-300 text-emerald-700 dark:text-emerald-300"
                                      : a.status === "template"
                                        ? "bg-blue-50/60 dark:bg-blue-500/10 border-blue-300 text-blue-700 dark:text-blue-300"
                                        : "bg-amber-50/60 dark:bg-amber-500/10 border-amber-300 text-amber-700 dark:text-amber-300"
                                  )}
                                >
                                  {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">{a.triggers.toLocaleString()}</td>
                              <td className="py-3 px-4 text-right">{a.submissions.toLocaleString()}</td>
                              <td className="py-3 px-4 text-right">{a.conversions}</td>
                              <td className="py-3 px-4">{new Date(a.updatedAt).toLocaleDateString()}</td>
                              <td className="py-3 px-4">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleTogglePause(a.id)}
                                    title={a.status === 'paused' ? "Resume" : "Pause"}
                                  >
                                    {a.status === 'paused' ? (
                                      <Play className="h-4 w-4" />
                                    ) : (
                                      <Pause className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(a)}>
                                    <Pencil className="h-4 w-4 mr-2" /> Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCopy(a)}
                                    title="Copy link"
                                  >
                                    {copiedId === a.id ? (
                                      <span className="text-xs font-medium">Copied</span>
                                    ) : (
                                      <CopyIcon className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDuplicateAutomation(a)}
                                    title="Duplicate"
                                  >
                                    <Files className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteAutomation(a.id)}
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

      {/* Edit Modal */}
      {editModalOpen && editingAutomation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-3/4 max-w-2xl p-6 relative">
            <Button
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => {
                setEditModalOpen(false)
                setEditingAutomation(null)
              }}
            >
              <X className="w-4 h-4" />
            </Button>
            <CardTitle>Edit Automation</CardTitle>
            <CardDescription className="mb-4">Update the details for your automation</CardDescription>

            <form className="flex flex-col gap-4" onSubmit={handleUpdateAutomation}>
              <div>
                <label className="text-sm font-medium mb-2 block">Automation Title *</label>
                <input
                  type="text"
                  placeholder="Enter automation title"
                  value={editingAutomation.title}
                  onChange={(e) => setEditingAutomation({ ...editingAutomation, title: e.target.value })}
                  className="border rounded-md p-2 w-full bg-background"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <textarea
                  placeholder="Enter automation description (optional)"
                  value={editingAutomation.description || ""}
                  onChange={(e) => setEditingAutomation({ ...editingAutomation, description: e.target.value })}
                  className="border rounded-md p-2 w-full bg-background"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select
                    value={editingAutomation.category}
                    onValueChange={(value) => setEditingAutomation({ ...editingAutomation, category: value as AutomationCategory })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lifecycle">Lifecycle</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="transactional">Transactional</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select
                    value={editingAutomation.status}
                    onValueChange={(value) => setEditingAutomation({ ...editingAutomation, status: value as AutomationStatus })}
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Timing (Days)</label>
                  <input
                    type="number"
                    placeholder="e.g., 7"
                    value={editingAutomation.timing}
                    onChange={(e) => setEditingAutomation({ ...editingAutomation, timing: parseInt(e.target.value) || 0 })}
                    className="border rounded-md p-2 w-full bg-background"
                    min="0"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Trigger Type</label>
                  <Select
                    value={editingAutomation.triggerType}
                    onValueChange={(value) => setEditingAutomation({ ...editingAutomation, triggerType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="inactive">Inactive Customer</SelectItem>
                      <SelectItem value="new_customer">New Customer</SelectItem>
                      <SelectItem value="anniversary">Anniversary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <Button type="submit" className="flex-1">
                  Update Automation
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditModalOpen(false)
                    setEditingAutomation(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <CreateAutomationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchAutomations}
      />
    </div>
  );
}
