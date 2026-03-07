"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"


type Question = {
  id: string
  text: string
  type: "short" | "truefalse" | "mcq"
  options?: string[]
  multiSelect?: boolean
}

type FormRow = {
  id: string
  title: string
  description?: string
  status: string
  views: number
  submissions: number
  conversions: number
  updatedAt: string
  questions?: Question[]
  access?: "public" | "verified"
}

export default function PublicFormPage() {
  const params = useParams()
  const formId = params.id as string

  const [form, setForm] = useState<FormRow | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!formId) return

    async function fetchForm() {
      try {
        const res = await fetch(`/api/forms/${formId}`)
        if (!res.ok) throw new Error("Failed to fetch form")
        const data: FormRow = await res.json()
        setForm(data)
      } catch (err) {
        console.error(err)
        toast.error("Failed to load form")
      }
    }

    fetchForm()
  }, [formId])

  if (!form) return <p className="p-6">Form not found</p>

  const handleChange = (qId: string, value: string | string[]) => {
  setAnswers((prev) => ({ ...prev, [qId]: value }))
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
    
      const payload = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }))

      const res = await fetch(`/api/forms/${formId}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Failed to submit form")

      setSubmitted(true)
      toast.success("Form submitted successfully!")
    } catch (err) {
      console.error(err)
      toast.error("Failed to submit form")
    }
  }

  if (submitted)
    return (
      <Card className="p-8 mx-auto my-12 w-full max-w-3xl">
        <CardTitle>Thank you!</CardTitle>
        <CardDescription>Your responses have been submitted.</CardDescription>
      </Card>
    )

  return (
    <Card className="p-8 mx-auto my-12 w-full max-w-3xl">
      <CardTitle className="text-3xl font-bold mb-2">{form.title}</CardTitle>
      {form.description && <CardDescription className="text-lg mb-4">{form.description}</CardDescription>}

      <form onSubmit={handleSubmit} className="mt-4 space-y-6">
        {form.questions?.map((q, index) => (
          <div key={q.id}>
            {/* Numbered question */}
            <label className="block font-medium mb-2">
              {index + 1}. {q.text}
            </label>

            {/* Short answer */}
            {q.type === "short" && (
              <input
                type="text"
                placeholder="Your answer..."
                value={answers[q.id] || ""}
                onChange={(e) => handleChange(q.id, e.target.value)}
                className="border rounded-md p-2 w-full bg-background"
                
              />
            )}

            {/* True/False */}
            {q.type === "truefalse" && (
              <div className="flex flex-col gap-2 ml-2">
                {["True", "False"].map((val) => (
                  <label key={val} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={q.id}
                      value={val.toLowerCase()}
                      checked={answers[q.id] === val.toLowerCase()}
                      onChange={(e) => handleChange(q.id, e.target.value)}
                      
                    />
                    {val}
                  </label>
                ))}
              </div>
            )}

            {/* MCQ */}
            {q.type === "mcq" && q.options && (
              <div className="flex flex-col gap-2 ml-2">
                {q.multiSelect ? (
                  // Multi-select checkbox
                  q.options.map((opt, i) => (
                    <label key={`${q.id}-checkbox-${i}`} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        value={opt}
                        checked={Array.isArray(answers[q.id]) && answers[q.id].includes(opt)}
                        onChange={(e) => {
                        const selected = Array.isArray(answers[q.id]) ? (answers[q.id] as string[]) : []

                        if (e.target.checked) {
                          handleChange(q.id, [...selected, opt])
                        } else {
                          handleChange(q.id, selected.filter((o) => o !== opt))
                        }
                      }}
                      />
                      {opt}
                    </label>
                  ))
                ) : (
                  // Single select radio buttons
                  q.options.map((opt, i) => (
                    <label key={`${q.id}-radio-${i}`} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={(e) => handleChange(q.id, e.target.value)}
                       
                      />
                      {opt}
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
        ))}

        <div className="flex justify-end mt-4">
          <Button type="submit">Submit</Button>
        </div>
      </form>
    </Card>
  )
}