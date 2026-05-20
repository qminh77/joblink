"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Wrench, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAddSkill, useRemoveSkill } from "@/features/profile/hooks"
import type { SkillRow } from "@/types/database"

export function SkillsSection({ skills }: { skills: SkillRow[] }) {
  const [name, setName] = useState("")
  const addMutation = useAddSkill()
  const removeMutation = useRemoveSkill()
  const t = useTranslations("profile.skills")

  function submit(event?: React.FormEvent) {
    event?.preventDefault()
    const value = name.trim()
    if (!value) return
    addMutation.mutate(value, { onSuccess: () => setName("") })
  }

  return (
    <>
      <h2 className="font-headline font-bold text-base text-foreground mb-4">
        {t("title")}
      </h2>

      <div className="flex flex-wrap gap-2 mb-4">
        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          skills.map((skill) => (
            <span
              key={skill.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted border border-border/40 rounded-full text-xs sm:text-sm font-medium text-foreground"
            >
              {skill.name}
              <button
                type="button"
                onClick={() => removeMutation.mutate(skill.id)}
                disabled={removeMutation.isPending}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
      </div>

      <form onSubmit={submit} className="flex gap-2">
        <div className="relative flex-1">
          <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-10 pl-9 rounded-xl"
            placeholder={t("placeholder")}
          />
        </div>
        <Button
          type="submit"
          variant="outline"
          className="h-10 rounded-xl"
          disabled={addMutation.isPending || name.trim().length === 0}
        >
          {t("addButton")}
        </Button>
      </form>
    </>
  )
}
