"use client"

import { useEffect, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MonthYearPicker } from "./month-year-picker"
import {
  useAddExperience,
  useUpdateExperience,
} from "@/features/profile/hooks"
import {
  createMemberExperienceSchema,
  type MemberExperienceInput,
} from "@/features/profile/schemas"
import type { MemberExperienceRow } from "@/types/database"

type ExperienceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  experience: MemberExperienceRow | null
}

function toFormValues(
  exp: MemberExperienceRow | null,
): MemberExperienceInput {
  if (!exp) {
    return {
      companyName: "",
      position: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: "",
    }
  }
  return {
    id: exp.id,
    companyName: exp.company_name,
    position: exp.position,
    startDate: exp.start_date?.slice(0, 7) ?? "",
    endDate: exp.end_date?.slice(0, 7) ?? "",
    isCurrent: exp.is_current,
    description: exp.description ?? "",
  }
}

export function ExperienceDialog({
  open,
  onOpenChange,
  experience,
}: ExperienceDialogProps) {
  const tCommon = useTranslations("common")
  const t = useTranslations("profile.experiences")
  const td = useTranslations("profile.experiences.dialog")
  const tv = useTranslations("profile.validation")

  const schema = useMemo(() => createMemberExperienceSchema(tv), [tv])
  const form = useForm<MemberExperienceInput>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(experience),
  })

  useEffect(() => {
    form.reset(toFormValues(experience))
  }, [experience, form])

  const isCurrent = form.watch("isCurrent")
  const addMutation = useAddExperience()
  const updateMutation = useUpdateExperience()
  const isPending = addMutation.isPending || updateMutation.isPending

  function onSubmit(values: MemberExperienceInput) {
    const mutation = experience ? updateMutation : addMutation
    mutation.mutate(values, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {experience ? td("editTitle") : td("addTitle")}
          </DialogTitle>
          <DialogDescription>{t("title")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{td("companyName")}</FormLabel>
                  <FormControl>
                    <Input {...field} className="h-10 rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{td("position")}</FormLabel>
                  <FormControl>
                    <Input {...field} className="h-10 rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{td("startDate")}</FormLabel>
                    <FormControl>
                      <MonthYearPicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{td("endDate")}</FormLabel>
                    <FormControl>
                      <MonthYearPicker
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        disabled={isCurrent}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isCurrent"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        const isOn = checked === true
                        field.onChange(isOn)
                        if (isOn) form.setValue("endDate", "")
                      }}
                    />
                  </FormControl>
                  <FormLabel className="text-sm text-muted-foreground cursor-pointer">
                    {td("isCurrent")}
                  </FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{td("description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      rows={4}
                      className="rounded-xl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-lg"
              >
                {tCommon("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-lg"
              >
                {isPending ? td("submitting") : td("submit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
