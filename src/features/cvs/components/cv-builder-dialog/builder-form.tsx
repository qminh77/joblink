"use client"

import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

import { CV_FILE_NAME_MAX } from "../../lib/constants"
import { CvBuilderPreview } from "../cv-builder-preview"
import type { ProfileData } from "./types"
import { useCvBuilder } from "./use-cv-builder"

export function BuilderForm({
  data,
  onClose,
}: {
  data: ProfileData
  onClose: () => void
}) {
  const t = useTranslations("cvs")
  const {
    fileName,
    filteredEdus,
    filteredExps,
    filteredSkills,
    generate,
    pending,
    previewEducations,
    previewExperiences,
    previewRef,
    selectedEdus,
    selectedExps,
    selectedSkills,
    setFileName,
    toggleEdu,
    toggleExp,
    toggleSkill,
  } = useCvBuilder({ data, onClose })

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-headline">
          {t("builderDialog.title")}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-3 py-2">
        <div className="space-y-1.5">
          <Label htmlFor="cv-builder-name" className="text-sm">
            {t("uploadDialog.nameLabel")}
          </Label>
          <Input
            id="cv-builder-name"
            value={fileName}
            onChange={(event) => setFileName(event.target.value)}
            maxLength={CV_FILE_NAME_MAX}
            placeholder={t("uploadDialog.namePlaceholder")}
            className="h-10 rounded-xl"
          />
        </div>

        <ScrollArea className="max-h-[60vh] -mx-1 px-1">
          <div className="space-y-4">
            {data.experiences.length > 0 ? (
              <div>
                <h3 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-1.5">
                  {t("builderDialog.experiences")}
                </h3>
                <div className="space-y-1">
                  {data.experiences.map((experience) => (
                    <label
                      key={experience.id}
                      className="flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedExps.has(experience.id)}
                        onCheckedChange={() => toggleExp(experience.id)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug text-foreground">
                          {experience.position}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {experience.companyName}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            {data.educations.length > 0 ? (
              <div>
                <h3 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-1.5">
                  {t("builderDialog.educations")}
                </h3>
                <div className="space-y-1">
                  {data.educations.map((education) => (
                    <label
                      key={education.id}
                      className="flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedEdus.has(education.id)}
                        onCheckedChange={() => toggleEdu(education.id)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug text-foreground">
                          {education.schoolName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {[education.degree, education.fieldOfStudy]
                            .filter(Boolean)
                            .join(" in ") || "\u00a0"}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            {data.skills.length > 0 ? (
              <div>
                <h3 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-1.5">
                  {t("builderDialog.skills")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {data.skills.map((skill) => (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => toggleSkill(skill.name)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        selectedSkills.has(skill.name)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {skill.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </div>

      <div className="fixed -left-[9999px] top-0" ref={previewRef}>
        <CvBuilderPreview
          fullName={data.fullName}
          email={data.email}
          phone={data.phone}
          headline={data.headline}
          experiences={previewExperiences}
          educations={previewEducations}
          skills={filteredSkills}
        />
      </div>

      <DialogFooter className="gap-1">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="h-9 px-3 inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors disabled:opacity-60"
        >
          {t("builderDialog.cancel")}
        </button>
        <button
          type="button"
          onClick={generate}
          disabled={
            pending ||
            (filteredExps.length === 0 &&
              filteredEdus.length === 0 &&
              filteredSkills.length === 0)
          }
          className="h-9 px-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : null}
          {t("builderDialog.create")}
        </button>
      </DialogFooter>
    </>
  )
}
