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
  Files,
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
import { useRouter } from 'next/navigation';

type Question = {
  id: string
  text: string
  type: "mcq" | "short" | "truefalse"
  options?: string[]
  multiSelect?: boolean 
  selectedOptions?: string[]   
}

type FormAccess = "public" | "verified"

type FormStatus = "active" | "template" | "custom"
type FormRow = {
  id: string
  title: string
  description?: string
  status: FormStatus
  access: FormAccess 
  questions: Question[] 
  views: number
  submissions: number
  conversions: number
  updatedAt: string // ISO date
  changePct?: number
}

type Submission = {
  id: string
  formId: string
  answers: Record<string, any> 
  createdAt: string
}

type DisplayAnswer = {
  questionId: string
  questionText: string
  type: "short" | "mcq" | "truefalse"
  answer: string | string[] 
}

type DisplaySubmission = Submission & {
  displayAnswers: DisplayAnswer[]
}

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
  const [forms, setForms] = useState<FormRow[]>([])
  const [loading, setLoading] = useState(true)
  const [newFormTitle, setNewFormTitle] = useState("")
  const [newFormDescription, setNewFormDescription] = useState("")
  const [newFormStatus, setNewFormStatus] = useState<FormStatus>("active")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [newFormAccess, setNewFormAccess] = useState<FormAccess>("public")
  const [newFormQuestions, setNewFormQuestions] = useState<Question[]>([])
  const [editQuestions, setEditQuestions] = useState<Question[]>(editingForm?.questions || [])

  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareForm, setShareForm] = useState<FormRow | null>(null) 
  const [audiences, setAudiences] = useState<{ id: string; name: string }[]>([])
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]) 

  const [previewForm, setPreviewForm] = useState<FormRow | null>(null)

  const [submissionsModalOpen, setSubmissionsModalOpen] = useState(false)
  const [currentSubmissions, setCurrentSubmissions] = useState<DisplaySubmission[]>([])
  const [selectedForm, setSelectedForm] = useState<FormRow | null>(null)

  const [viewingSubmission, setViewingSubmission] = useState<DisplaySubmission | null>(null);
  
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [statsForm, setStatsForm] = useState<FormRow | null>(null);  
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

  // view / sort / group / pagination
  type ViewMode = "grid" | "table"
  const [view, setView] = useState<ViewMode>("grid")

  type SortKey = "updated_desc" | "title_asc" | "views_desc" | "subs_desc" | "conv_desc"
  const [sortKey, setSortKey] = useState<SortKey>("updated_desc")

  type GroupKey = "none" | "status" | "month"
  const [groupKey, setGroupKey] = useState<GroupKey>("none")

  const [pageSize, setPageSize] = useState(12)
  const [page, setPage] = useState(1)

  const router = useRouter();

   useEffect(() => {
      if (editingForm) {
        setEditQuestions(editingForm.questions || [])
      }
   }, [editingForm])

   useEffect(() => {
    async function fetchForms() {
      try {
        setLoading(true)
        const res = await fetch("/api/forms") 
        if (!res.ok) throw new Error("Failed to fetch forms")
        const data: FormRow[] = await res.json()
        setForms(data)
      } catch (err) {
        console.error(err)
        toast.error("Failed to load forms")
      } finally {
        setLoading(false)
      }
    }
    fetchForms()
  }, [])

  // Delete
  const handleDeleteForm = async (id: string) => {
     try {
      const res = await fetch(`/api/forms/${id}`, { method: "DELETE" }) 
      if (!res.ok) throw new Error("Failed to delete form")
      setForms(prev => prev.filter(f => f.id !== id))
      toast.success("Form deleted!")
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete form")
    }
  }

  // Duplicate
  const handleDuplicateForm = async (form: FormRow) => {
  try {
    const res = await fetch(`/api/forms/${form.id}`, { method: "POST" }) 
    if (!res.ok) throw new Error("Failed to duplicate form")
    const duplicatedForm: FormRow = await res.json() 
    setForms(prevForms => [duplicatedForm, ...prevForms])
    toast.success("Form duplicated successfully")
  } catch (err) {
    console.error(err)
    toast.error("Failed to duplicate form")
  }
}

  // Create
   const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFormTitle.trim()) return

    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newFormTitle,
          description: newFormDescription || undefined,
          status: newFormStatus,
          access: newFormAccess,
          questions: newFormQuestions,
        }),
      })
      if (!res.ok) throw new Error("Failed to create form")
      const createdForm = await res.json() 
      setForms(prev => [createdForm, ...prev])

      // reset modal
      setNewFormTitle("")
      setNewFormDescription("")
      setNewFormStatus("active")
      setNewFormAccess("public")
      setNewFormQuestions([])
      setModalOpen(false)
      setPage(1)
      toast.success("Form created successfully!")
    } catch (err) {
      console.error(err)
      toast.error("Failed to create form")
    }
  }


  // Edit modal
  const handleOpenEdit = (form: FormRow) => {
    setEditingForm(form)
    setEditModalOpen(true)
  }

  // Update
  const handleUpdateForm = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!editingForm) return

  try {
    const res = await fetch(`/api/forms/${editingForm.id}`, {
      method: "PUT", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editingForm,
        questions: editQuestions, 
        updatedAt: new Date().toISOString(),
      }),
    })
    if (!res.ok) throw new Error("Failed to update form")

    const updatedForm: FormRow = await res.json()

    
    setForms(prev => prev.map(f => (f.id === updatedForm.id ? updatedForm : f)))
    setEditModalOpen(false)
    setEditingForm(null)
    toast.success("Form updated successfully!")
  } catch (err) {
    console.error(err)
    toast.error("Failed to update form")
  }
}
  // URL + Copy + Share helpers
  function formUrl(id: string) {
    if (typeof window === "undefined") return `/fillableform/${id}`
    return `${window.location.origin}/fillableform/${id}`
  }

  async function handleCopy(form: FormRow) {
    const url = formUrl(form.id)
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(form.id)
      toast.success("Link copied to clipboard!")
      setTimeout(() => setCopiedId(null), 1200)
    } catch {
      window.prompt("Copy form link:", url) 
    }
  }

  const handleShare = (form: FormRow) => {
  setShareForm(form)
  setShareModalOpen(true)
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

  const handleViewSubmissions = async (form: FormRow) => {
    try {
      const res = await fetch(`/api/forms/${form.id}/submissions`);
      if (!res.ok) throw new Error("Failed to fetch submissions");

      const data: {
        id: string;
        formId: string;
        answers: { questionId: string; answer: any }[];
        createdAt: string;
      }[] = await res.json();

      const mapped: DisplaySubmission[] = data.map((sub) => {
        const answerMap: Record<string, any> = {};
        sub.answers.forEach((a) => {
          answerMap[a.questionId] = a.answer;
        });

        const displayAnswers: DisplayAnswer[] = sub.answers
          .map((a) => {
            const question = form.questions.find((q) => q.id === a.questionId);
            if (!question) return null;

            let answer: string | string[] = "";

            switch (question.type) {
              case "mcq": {
                const opts = question.options ?? [];
                if (Array.isArray(a.answer)) {
                  answer = a.answer
                    .map((ans) =>
                      !isNaN(Number(ans)) ? opts[Number(ans)] : String(ans)
                    )
                    .filter(Boolean);
                } else if (!isNaN(Number(a.answer))) {
                  answer = opts[Number(a.answer)] ? [opts[Number(a.answer)]] : [];
                } else {
                  answer = [String(a.answer)];
                }
                break;
              }

              case "truefalse":
                answer = a.answer === true || a.answer === "true" ? "true" : "false";
                break;

              case "short":
                answer = String(a.answer ?? "");
                break;
            }

            return {
              questionId: a.questionId,
              questionText: question.text,
              type: question.type,
              answer,
            };
          })
          .filter(Boolean) as DisplayAnswer[];

        return {
          id: sub.id,
          formId: sub.formId,
          answers: answerMap,
          createdAt: sub.createdAt,
          displayAnswers,
        };
      });

      setSelectedForm(form);
      setCurrentSubmissions(mapped);
      setSubmissionsModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load submissions");
    }
  };

  useEffect(() => {
    if (shareModalOpen) {
      async function fetchAudiences() {
        try {
          const res = await fetch("/api/audience")
          if (!res.ok) throw new Error("Failed to fetch audiences")
          const data: { id: string; name: string; customerCount: number}[] = await res.json()
          setAudiences(data)
        } catch (err) {
          console.error(err)
          toast.error("Failed to load audiences")
        }
      }
      fetchAudiences()
    }
  }, [shareModalOpen])

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

              <div>
                <label className="text-sm font-medium mb-2 block">Access</label>
                <Select value={newFormAccess} onValueChange={(v) => setNewFormAccess(v as FormAccess)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                  </SelectContent>
                </Select>
              </div>

               <div>
                <label className="text-sm font-medium mb-2 block">Questions</label>
            
                <Button 
                  type="button"
                  onClick={() => setNewFormQuestions([...newFormQuestions, { id: crypto.randomUUID(), type: "short", text: "" }])}>
                  Add Question
                </Button>
               </div>

              {newFormQuestions.length > 0 && (
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto border p-2 rounded-md">
              {newFormQuestions.map((q, i) => (
                <div key={q.id} className="flex flex-col gap-2 mb-2 border p-2 rounded-md">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Question text"
                      value={q.text}
                      onChange={(e) => {
                        const copy = [...newFormQuestions]
                        copy[i].text = e.target.value
                        setNewFormQuestions(copy)
                      }}
                      className="border rounded-md p-2 flex-1"
                    />
                    <Select
                      value={q.type}
                      onValueChange={(v) => {
                        const copy = [...newFormQuestions]
                        copy[i].type = v as Question["type"]
                        if (v === "mcq" && !copy[i].options) 
                          copy[i].options = ["", ""]
                        setNewFormQuestions(copy)
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mcq">Multiple Choice</SelectItem>
                        <SelectItem value="short">Short Answer</SelectItem>
                        <SelectItem value="truefalse">True/False</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setNewFormQuestions(newFormQuestions.filter((_, idx) => idx !== i))
                      }
                    >
                      Delete
                    </Button>
                  </div>

                  
                  {q.type === "mcq" && (
                    <div className="flex flex-col gap-2 ml-4">
                      {/* Multi-select toggle */}
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          id={`multi-${q.id}`}
                          checked={q.multiSelect || false}
                          onChange={(e) => {
                            const copy = [...newFormQuestions]
                            copy[i].multiSelect = e.target.checked
                            setNewFormQuestions(copy)
                          }}
                        />
                        <label htmlFor={`multi-${q.id}`} className="text-sm">
                          Allow multiple selections
                        </label>
                      </div>

                      {/* Options editor */}
                      <div className="flex flex-col gap-2 max-h-40 overflow-y-auto border p-2 rounded-md">
                        {q.options!.map((opt, oi) => (
                          <div key={oi} className="flex gap-2">
                            <input
                              type="text"
                              placeholder={`Option ${oi + 1}`}
                              value={opt}
                              onChange={(e) => {
                                const copy = [...newFormQuestions]
                                copy[i].options![oi] = e.target.value
                                setNewFormQuestions(copy)
                              }}
                              className="border rounded-md p-2 flex-1"
                            />
                            <Button
                              variant="ghost"
                              onClick={() => {
                                const copy = [...newFormQuestions]
                                copy[i].options!.splice(oi, 1)
                                if (copy[i].selectedOptions)
                                  copy[i].selectedOptions = copy[i].selectedOptions!.filter(o => o !== opt)
                                setNewFormQuestions(copy)
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        ))}
                      </div>

                      <Button
                        type="button"
                        onClick={() => {
                          const copy = [...newFormQuestions]
                          copy[i].options!.push("")
                          setNewFormQuestions(copy)
                        }}
                      >
                        Add Option
                      </Button>
                    </div>
                  )}

                  {q.type === "truefalse" && (
                    <div className="ml-4 text-sm text-muted-foreground">
                     True/False question
                   </div>
                  )}
                </div>
              ))}
              </div>
              )}
              <div className="flex gap-2 mt-2">

               <Button
                  type="button"
                  variant="outline"
                  aria-label="Preview form"
                  className="flex items-center gap-2"
                  onClick={() => {
                    const formData = {
                      title: newFormTitle,
                      description: newFormDescription,
                      questions: newFormQuestions,
                    } as any;

                    if (formData.title?.trim() || formData.description?.trim() || formData.questions.length > 0) {
                      setPreviewForm(formData);
                    } else {
                      toast("Nothing to preview");
                    }
                  }}
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </Button>

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
                  onChange={(e) => setEditingForm({ ...editingForm, title: e.target.value, questions: editQuestions })}
                  className="border rounded-md p-2 w-full bg-background"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <textarea
                  placeholder="Enter form description (optional)"
                  value={editingForm.description || ""}
                  onChange={(e) => setEditingForm({ ...editingForm, description: e.target.value, questions: editQuestions})}
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

              <div>
                <label className="text-sm font-medium mb-2 block">Access</label>
                <Select value={newFormAccess} onValueChange={(v) => setNewFormAccess(v as FormAccess)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                  </SelectContent>
                </Select>
                </div>
   
                <div>
                <label className="text-sm font-medium mb-2 block">Questions</label>
                <Button
                  type="button"
                  
                  onClick={() =>
                    setEditQuestions([...editQuestions, { id: crypto.randomUUID(), type: "short", text: "" }])
                  }
                >
                  Add Question
                </Button>
                </div>
                {editQuestions.length > 0 && (
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto border p-2 rounded-md">
                  {editQuestions.map((q, i) => (
                    <div key={q.id} className="flex flex-col gap-2 mb-2 border p-2 rounded-md">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Question text"
                          value={q.text}
                          onChange={(e) => {
                            const copy = [...editQuestions];
                            copy[i].text = e.target.value;
                            setEditQuestions(copy);
                          }}
                          className="border rounded-md p-2 flex-1"
                        />
                        <Select
                          value={q.type}
                          onValueChange={(v) => {
                            const copy = [...editQuestions];
                            copy[i].type = v as Question["type"];
                            if (v === "mcq" && !copy[i].options) 
                              copy[i].options = ["", ""];
                            setEditQuestions(copy);
                          }}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mcq">Multiple Choice</SelectItem>
                            <SelectItem value="short">Short Answer</SelectItem>
                            <SelectItem value="truefalse">True/False</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          onClick={() => setEditQuestions(editQuestions.filter((_, idx) => idx !== i))}
                        >
                          Delete
                        </Button>
                      </div>

                      {/* MCQ Options + Multi-select */}
                      {q.type === "mcq" && (
                        <div className="flex flex-col gap-2">
                          {/* Multi-select toggle */}
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`multi-${q.id}`}
                              checked={q.multiSelect || false}
                              onChange={(e) => {
                                const copy = [...editQuestions];
                                copy[i].multiSelect = e.target.checked;
                                setEditQuestions(copy);
                              }}
                            />
                            <label htmlFor={`multi-${q.id}`} className="text-sm">
                              Allow multiple selections
                            </label>
                          </div>

                          {/* Options editor */}
                          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto border p-2 rounded-md">
                            {q.options!.map((opt, oi) => (
                              <div key={oi} className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder={`Option ${oi + 1}`}
                                  value={opt}
                                  onChange={(e) => {
                                    const copy = [...editQuestions];
                                    copy[i].options![oi] = e.target.value;
                                    setEditQuestions(copy);
                                  }}
                                  className="border rounded-md p-2 flex-1"
                                />
                                <Button
                                  variant="ghost"
                                  onClick={() => {
                                    const copy = [...editQuestions];                                    
                                    copy[i].options!.splice(oi, 1);                                    
                                    if (copy[i].selectedOptions)
                                      copy[i].selectedOptions = copy[i].selectedOptions!.filter(o => o !== opt);
                                    setEditQuestions(copy);
                                  }}
                                >
                                  Delete
                                </Button>
                              </div>
                            ))}
                          </div>

                          <Button
                            type="button"
                            onClick={() => {
                              const copy = [...editQuestions];
                              copy[i].options!.push("");
                              setEditQuestions(copy);
                            }}
                          >
                            Add Option
                          </Button>
                        </div>
                      )}

                      {/* True/False */}
                      {q.type === "truefalse" && (
                        <div className="ml-4 text-sm text-muted-foreground">
                          True/False question
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                )}

              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  title="Preview form"
                  aria-label="Preview form"
                  className="flex items-center gap-2"
                  onClick={() => {
                    if (
                      editingForm && (editingForm.title?.trim() ||  editingForm.description?.trim() || (editQuestions && editQuestions.length > 0))
                    ) {
                      setPreviewForm({
                        ...editingForm,
                        questions: editQuestions,
                      });
                    } else {
                      toast("Nothing to preview");
                    }
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>

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
      )
      
      }

      {shareModalOpen && shareForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-3/4 max-w-md p-6 relative bg-background">
            <Button size="sm" className="absolute top-4 right-4" onClick={() => setShareModalOpen(false)}>
              <X className="w-4 h-4" />
            </Button>

            <CardTitle>Share Form</CardTitle>
            <CardDescription className="mb-4">Share your form using a link or directly with audiences</CardDescription>

            <div className="flex flex-col gap-4">
              {/* Copy URL */}
              <div className="flex items-center justify-between border rounded p-2">
                <span className="truncate">{formUrl(shareForm.id)}</span>
                <Button size="sm" onClick={async () => { await navigator.clipboard.writeText(formUrl(shareForm.id)); toast.success("Link copied!"); }}>
                  Copy Link
                </Button>
              </div>

              {/* Native share */}
              {navigator.share && (
                <Button onClick={async () => {
                  try {
                    await navigator.share({ title: shareForm.title, text: `Check out this form: ${shareForm.title}`, url: formUrl(shareForm.id) });
                    toast.success("Form shared successfully!");
                    setShareModalOpen(false);
                  } catch { toast.error("Share cancelled or failed"); }
                }}>
                  Share via Device
                </Button>
              )}

              {/* Audiences */}
              <div>
                <label className="block mb-2 text-sm font-medium">Select Audiences</label>
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto border p-2 rounded-md">
                  {audiences.map(a => (
                    <label key={a.id} className="flex items-center gap-2">
                     <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedAudiences.includes(a.id)}
                        onChange={e => {
                          if (e.target.checked) setSelectedAudiences([...selectedAudiences, a.id]);
                          else setSelectedAudiences(selectedAudiences.filter(id => id !== a.id));
                        }}
                        className="w-4 h-4"
                      />
                      <span>{a.name}</span>
                     </div> 
                     <span className="ml-auto text-sm text-white">{(a as any).customerCount ?? 0} {((a as any).customerCount ?? 0) === 1 ? "customer" : "customers"}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => {
                
                  const prefillName = encodeURIComponent(shareForm.title);
                  const prefillBody = encodeURIComponent(formUrl(shareForm.id));;
                  const prefillAudience = encodeURIComponent(selectedAudiences.join(','));

                  setShareModalOpen(false);
                  setSelectedAudiences([]);

                  router.push(`/broadcasts?prefillName=${prefillName}&prefillBody=${prefillBody}&prefillAudience=${prefillAudience}`);
                }}
              >
                Share with Audiences
              </Button>
            </div>
          </Card>
        </div>
      )}
      
      {/* Preview Modal */}
      {previewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-2xl max-h-[90vh] p-6 relative overflow-auto">
            <Button
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => setPreviewForm(null)}
            >
              <X className="w-4 h-4" />
            </Button>

            <CardTitle className="text-3xl font-bold mb-2">{previewForm.title}</CardTitle>
            {previewForm.description && (
              <CardDescription className="text-lg mb-4">
                {previewForm.description}
              </CardDescription>
            )}

            <div className="flex flex-col space-y-6 mt-4">
              {previewForm.questions.map((q, index) => (
                <div key={q.id}>
                  <label className="block font-medium mb-2">
                    {index + 1}. {q.text}
                  </label>

                  {/* Short answer */}
                  {q.type === "short" && (
                    <input
                      type="text"
                      placeholder="Your answer..."
                      className="border rounded-md p-2 w-full bg-background text-foreground"
                    />
                  )}

                  {/* True/False */}
                  {q.type === "truefalse" && (
                    <div className="flex flex-col gap-2 ml-2">
                      {["True", "False"].map((val) => (
                        <label key={val} className="flex items-center gap-2">
                          <input type="radio" name={q.id} />
                          <span className="text-foreground">{val}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* MCQ */}
                  {q.type === "mcq" && q.options && (
                    <div className="flex flex-col gap-2 ml-2">
                      {q.multiSelect
                        ? q.options.map((opt, i) => (
                            <label key={i} className="flex items-center gap-2">
                              <input type="checkbox" />
                              <span className="text-foreground">{opt}</span>
                            </label>
                          ))
                        : q.options.map((opt, i) => (
                            <label key={i} className="flex items-center gap-2">
                              <input type="radio" name={q.id} />
                              <span className="text-foreground">{opt}</span>
                            </label>
                          ))}
                    </div>
                  )}
                </div>
              ))}
              {/* Submit Button */}
              <Button type="submit" className="mt-4 self-end">
                Submit
              </Button>
            </div>
            
          </Card>
        </div>
      )}

     
      {/* Submissions Modal */}
        {submissionsModalOpen && selectedForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-3/4 max-w-3xl p-6 relative overflow-auto">
              <Button
                size="sm"
                className="absolute top-4 right-4"
                onClick={() => setSubmissionsModalOpen(false)}
              >
                Close
              </Button>

              <CardTitle>Submissions for {selectedForm.title}</CardTitle>
              {selectedForm.description && (
                <p className="mt-2 text-sm text-muted-foreground">{selectedForm.description}</p>
              )}

              {currentSubmissions.length > 0 && (
                <div className="mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setStatsForm(selectedForm);
                      setStatsModalOpen(true);
                    }}
                  >
                    View Statistics
                  </Button>
                </div>
              )}

              {currentSubmissions.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">No submissions yet</p>
              ) : (
                <div className="mt-4 space-y-2">
                  {currentSubmissions
                    .slice() 
                    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    .map((sub, index) => (
                      <div key={sub.id} className="border rounded p-2 flex justify-between items-center">
                        <span className="font-medium">{index + 1}.</span>
                        <Button size="sm" onClick={() => setViewingSubmission(sub)}>
                          View
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Viewing Single Submission */}
        {viewingSubmission && selectedForm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
            <Card className="w-3/4 max-w-3xl p-6 relative overflow-auto">
              <Button
                size="sm"
                className="absolute top-4 right-4"
                onClick={() => setViewingSubmission(null)}
              >
                Close
              </Button>

              <CardTitle>Submission Details</CardTitle>
              <p className="text-sm text-muted-foreground mb-4">
                Submitted at: {new Date(viewingSubmission.createdAt).toLocaleString()}
              </p>

              <div className="mt-4 space-y-6">
                {selectedForm.questions.map((q, index) => {
                  const ans = viewingSubmission.displayAnswers.find(a => a.questionId === q.id);

                  return (
                    <div key={q.id} className="flex flex-col gap-2">
                      <label className="block font-medium">
                        {index + 1}. {q.text}
                      </label>

                      {!ans ? (
                        <p className="p-2 border rounded-md bg-background text-muted-foreground">
                          No answer submitted
                        </p>
                      ) : q.type === "short" ? (
                        <input
                          type="text"
                          value={ans.answer as string}
                          disabled
                          className="border rounded-md p-2 w-full bg-background"
                        />
                      ) : q.type === "truefalse" ? (
                        <div className="flex flex-col gap-2 ml-2">
                          {["true", "false"].map(val => (
                            <label key={val} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={q.id}
                                checked={ans.answer === val}
                                disabled
                              />
                              <span>{val.charAt(0).toUpperCase() + val.slice(1)}</span>
                            </label>
                          ))}
                        </div>
                      ) : q.type === "mcq" && q.options ? (
                        <div className="flex flex-col gap-2 ml-2">
                          {q.options.map(opt => {
                            const isChecked = q.multiSelect
                              ? Array.isArray(ans.answer) && (ans.answer as string[]).includes(opt)
                              : Array.isArray(ans.answer)
                                ? ans.answer[0] === opt
                                : ans.answer === opt;

                            return (
                              <label key={opt} className="flex items-center gap-2">
                                <input
                                  type={q.multiSelect ? "checkbox" : "radio"}
                                  name={q.id}
                                  checked={isChecked}
                                  readOnly
                                  
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}


        {/* Statistics Modal */}
        {statsModalOpen && statsForm && (
          <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/50">
            <Card className="w-3/4 max-w-3xl p-6 relative overflow-auto max-h-[90vh]">
              
              <Button
                size="sm"
                className="absolute top-4 right-4"
                onClick={() => setStatsModalOpen(false)}
              >
                Close
              </Button>

              <CardTitle>Statistics for {statsForm.title}</CardTitle>
              {statsForm.description && (
                <p className="mt-2 text-sm text-muted-foreground">{statsForm.description}</p>
              )}

              {/* Questions */}
              <div className="flex flex-col gap-6 mt-6">
                {statsForm.questions.map((q, idx) => (
                  <div key={q.id} className="flex flex-col gap-2">
                    <p className="font-medium">{idx + 1}. {q.text}</p>

                    {/* Multiple Choice or True/False */}
                    {(q.type === "mcq" || q.type === "truefalse") && (
                      <div className="flex flex-col gap-2 ml-2">
                        {(q.options || (q.type === "truefalse" ? ["true", "false"] : [])).map(opt => {
                          const count = currentSubmissions.filter(sub => {
                            const ans = sub.displayAnswers.find(a => a.questionId === q.id)?.answer;
                            if (q.multiSelect && Array.isArray(ans)) return ans.includes(opt);
                            return ans === opt || (Array.isArray(ans) && ans[0] === opt);
                          }).length;
                          const total = currentSubmissions.length;
                          const percent = total > 0 ? (count / total) * 100 : 0;

                          return (
                            <div key={opt} className="flex items-center gap-2">
                              <span className="w-32">{opt.charAt(0).toUpperCase() + opt.slice(1)}</span>
                              <div className="flex-1 h-5 bg-gray-200 rounded">
                                <div
                                  className="h-5 bg-blue-500 rounded"
                                  style={{ width: `${percent}%` }}
                                ></div>
                              </div>
                              <span className="w-16 text-sm text-right">
                                {count} ({Math.round(percent)}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Short Answer */}
                    {q.type === "short" && (
                      <div className="ml-2 flex flex-col gap-1 max-h-40 overflow-auto border rounded p-2 bg-background">
                        {currentSubmissions
                          .map(sub => sub.displayAnswers.find(a => a.questionId === q.id)?.answer as string)
                          .filter(Boolean)
                          .map((ans, i) => (
                            <p key={i} className="text-sm border-b last:border-b-0 p-1">{ans}</p>
                          ))}
                        {currentSubmissions.every(sub => !sub.displayAnswers.find(a => a.questionId === q.id)?.answer) && (
                          <p className="text-sm text-muted-foreground">No answers submitted yet</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
                          
                          {/*Preview*/}

                          <Button
                            variant="outline"
                            onClick={() => {
                              if (
                                f.title?.trim() ||
                                f.description?.trim() ||
                                (f.questions && f.questions.length > 0)
                              ) {
                                setPreviewForm(f);
                              } else {
                                toast("Nothing to preview");
                              }
                            }}
                            aria-label="Preview form"
                            title="Preview form"
                          >
                            <Eye className="h-4 w-4" />
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

                          {/* Duplicate */}
                          <Button
                            variant="outline"
                            className="px-3"
                            onClick={() => handleDuplicateForm(f)}
                            aria-label="Duplicate form"
                            title="Duplicate"
                          >
                            <Files className="h-4 w-4" />
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

                          {/* View Submissions */}
                          <Button
                            variant="outline"
                            className="mt-3 w-full flex items-center justify-center gap-2"
                            onClick={() => handleViewSubmissions(f)}
                            aria-label="View submissions"
                            title="Submissions"
                          >
                            <Inbox className="h-4 w-4" /> 
                            View Submissions
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
                                  <Button size="sm" variant="outline" onClick={() => setPreviewForm(f)} title="Preview">
                                    <Eye className="h-4 w-4" />
                                  </Button>

                                  <Button size="sm" variant="outline" onClick={() => handleCopy(f)} title="Copy link">
                                    {copiedId === f.id ? (
                                      <span className="text-xs font-medium">Copied</span>
                                    ) : (
                                      <CopyIcon className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleDuplicateForm(f)} title="Duplicate">
                                    <Files className="h-4 w-4" />
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
