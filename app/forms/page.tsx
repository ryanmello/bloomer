// app/forms/page.tsx
"use client"

import { useState } from "react"
import { Card, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"
import Link from "next/link"

export default function Forms() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="p-6 relative">
      {/* Full-width Forms Panel */}
      <Card className="flex flex-row justify-between items-center p-6 bg-card">
        {/* Left side: Title + Description */}
        <div className="flex-1">
          <CardTitle className="text-2xl font-bold">Forms</CardTitle>
          <CardDescription>
            Create and share forms to collect valuable customer information
          </CardDescription>
        </div>

        {/* Right side: Create Form Button */}
        <Button
          size="lg"
          className="flex items-center gap-2"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="w-4 h-4" /> Create Form
        </Button>
      </Card>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-3/4 max-w-2xl p-6 relative">
            <Button
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => setModalOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
            <CardTitle>Create a New Form</CardTitle>
            <CardDescription className="mb-4">
              Fill in the details for your new form
            </CardDescription>

            <form className="flex flex-col gap-4" onSubmit={(e) => {
              e.preventDefault()
              setModalOpen(false)
            }}>
              <input
                type="text"
                placeholder="Form Title"
                className="border rounded-md p-2 w-full"
              />
              <textarea
                placeholder="Form Description"
                className="border rounded-md p-2 w-full"
              />
              <Button type="submit" className="mt-2">
                Save Form
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
