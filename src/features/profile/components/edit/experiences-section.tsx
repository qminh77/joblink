"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Briefcase, Pencil, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useDeleteExperience } from "@/features/profile/hooks"
import { formatDate } from "@/lib/utils/format"
import type { MemberExperienceRow } from "@/types/database"

import { ExperienceDialog } from "./experience-dialog"

export function ExperiencesSection({
  experiences,
}: {
  experiences: MemberExperienceRow[]
}) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<MemberExperienceRow | null>(null)
  const deleteMutation = useDeleteExperience()
  const t = useTranslations("profile.experiences")

  function openCreate() {
    setEditing(null)
    setOpen(true)
  }

  function openEdit(exp: MemberExperienceRow) {
    setEditing(exp)
    setOpen(true)
  }

  function handleDelete(id: number) {
    if (!confirm(t("deleteConfirm"))) return
    deleteMutation.mutate(id)
  }

  return (
    <>
      <ExperienceDialog
        open={open}
        onOpenChange={setOpen}
        experience={editing}
      />

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-headline font-bold text-base text-foreground">
          {t("title")}
        </h2>
        <Button size="sm" className="rounded-lg" onClick={openCreate}>
          <Plus className="w-3.5 h-3.5 mr-1" /> {t("addButton")}
        </Button>
      </div>

      {experiences.length === 0 ? (
        <div className="py-10 text-center">
          <Briefcase className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {t("empty")}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/30">
          {experiences.map((exp) => (
            <li
              key={exp.id}
              className="py-4 first:pt-0 last:pb-0 flex gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Briefcase className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-foreground">
                  {exp.position}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {exp.company_name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(exp.start_date)} —{" "}
                  {exp.is_current
                    ? t("current")
                    : exp.end_date
                      ? formatDate(exp.end_date)
                      : "—"}
                </p>
                {exp.description ? (
                  <p className="text-xs text-muted-foreground mt-2 whitespace-pre-line">
                    {exp.description}
                  </p>
                ) : null}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => openEdit(exp)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(exp.id)}
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
