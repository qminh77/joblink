"use client"

import { useState } from "react"
import { GraduationCap, Pencil, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useDeleteEducation } from "@/features/profile/hooks"
import { formatDate } from "@/lib/utils/format"
import type { MemberEducationRow } from "@/types/database"

import { EducationDialog } from "./education-dialog"

export function EducationsSection({
  educations,
}: {
  educations: MemberEducationRow[]
}) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<MemberEducationRow | null>(null)
  const deleteMutation = useDeleteEducation()

  function handleDelete(id: number) {
    if (!confirm("Bạn có chắc muốn xóa thông tin học vấn này?")) return
    deleteMutation.mutate(id)
  }

  return (
    <>
      <EducationDialog
        open={open}
        onOpenChange={setOpen}
        education={editing}
      />

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-headline font-bold text-base text-foreground">
          Học vấn
        </h2>
        <Button
          size="sm"
          className="rounded-lg"
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Thêm
        </Button>
      </div>

      {educations.length === 0 ? (
        <div className="py-10 text-center">
          <GraduationCap className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Chưa có thông tin học vấn
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/30">
          {educations.map((edu) => (
            <li
              key={edu.id}
              className="py-4 first:pt-0 last:pb-0 flex gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <GraduationCap className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-foreground">
                  {edu.school_name}
                </h3>
                {edu.degree || edu.field_of_study ? (
                  <p className="text-sm text-muted-foreground">
                    {[edu.degree, edu.field_of_study]
                      .filter(Boolean)
                      .join(" — ")}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {edu.start_date ? formatDate(edu.start_date) : "—"} —{" "}
                  {edu.end_date ? formatDate(edu.end_date) : "—"}
                </p>
                {edu.description ? (
                  <p className="text-xs text-muted-foreground mt-2 whitespace-pre-line">
                    {edu.description}
                  </p>
                ) : null}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setEditing(edu)
                    setOpen(true)
                  }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(edu.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
