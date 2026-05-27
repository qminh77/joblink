"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { AnimatePresence, motion } from "framer-motion"
import { CalendarClock, Loader2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { modalContent, modalOverlay } from "@/lib/animations"

import { useScheduleInterview } from "../../hooks"

type Props = {
  applicationId: number
  applicantName: string
  open: boolean
  onClose: () => void
}

const DURATION_OPTIONS = [30, 45, 60, 90, 120] as const

export function InterviewScheduleDialog({
  applicationId,
  applicantName,
  open,
  onClose,
}: Props) {
  const t = useTranslations("companies.interview")
  const [scheduledAt, setScheduledAt] = useState("")
  const [duration, setDuration] = useState("60")
  const [locationOrLink, setLocationOrLink] = useState("")
  const [note, setNote] = useState("")

  const schedule = useScheduleInterview()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (schedule.isPending || !scheduledAt) return
    const iso = new Date(scheduledAt).toISOString()
    schedule.mutate(
      {
        applicationId,
        scheduledAt: iso,
        durationMinutes: Number(duration),
        locationOrLink: locationOrLink.trim() || null,
        note: note.trim() || null,
      },
      {
        onSuccess: (result) => {
          if (result.ok) {
            setScheduledAt("")
            setLocationOrLink("")
            setNote("")
            onClose()
          }
        },
      },
    )
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          variants={modalOverlay}
          initial="hidden"
          animate="show"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            variants={modalContent}
            initial="hidden"
            animate="show"
            exit="exit"
            className="w-full max-w-md bg-card border border-border/40 rounded-2xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border/40">
              <div className="min-w-0">
                <h2 className="font-headline font-bold text-base truncate flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-primary" />
                  {t("title")}
                </h2>
                <p className="text-xs text-muted-foreground truncate">
                  {applicantName}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground"
                aria-label={t("close")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="interview-at" className="font-medium text-sm">
                  {t("scheduledAtLabel")}
                </Label>
                <Input
                  id="interview-at"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  disabled={schedule.isPending}
                  required
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-medium text-sm">
                  {t("durationLabel")}
                </Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="h-11 rounded-xl w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {t("durationMinutes", { count: d })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interview-loc" className="font-medium text-sm">
                  {t("locationLabel")}
                </Label>
                <Input
                  id="interview-loc"
                  value={locationOrLink}
                  onChange={(e) => setLocationOrLink(e.target.value)}
                  disabled={schedule.isPending}
                  maxLength={500}
                  placeholder={t("locationPlaceholder")}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interview-note" className="font-medium text-sm">
                  {t("noteLabel")}
                </Label>
                <Textarea
                  id="interview-note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={schedule.isPending}
                  maxLength={2000}
                  placeholder={t("notePlaceholder")}
                  className="rounded-xl resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={schedule.isPending}
                  className="rounded-lg"
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={schedule.isPending || !scheduledAt}
                  className="rounded-lg"
                >
                  {schedule.isPending ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <CalendarClock className="w-4 h-4 mr-1.5" />
                  )}
                  {t("submit")}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
