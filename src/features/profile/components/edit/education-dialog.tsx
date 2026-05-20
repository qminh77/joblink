"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
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
import {
  useAddEducation,
  useUpdateEducation,
} from "@/features/profile/hooks"
import {
  memberEducationSchema,
  type MemberEducationInput,
} from "@/features/profile/schemas"
import type { MemberEducationRow } from "@/types/database"

type EducationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  education: MemberEducationRow | null
}

function toFormValues(
  edu: MemberEducationRow | null,
): MemberEducationInput {
  if (!edu) {
    return {
      schoolName: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
      description: "",
    }
  }
  return {
    id: edu.id,
    schoolName: edu.school_name,
    degree: edu.degree ?? "",
    fieldOfStudy: edu.field_of_study ?? "",
    startDate: edu.start_date?.slice(0, 7) ?? "",
    endDate: edu.end_date?.slice(0, 7) ?? "",
    description: edu.description ?? "",
  }
}

export function EducationDialog({
  open,
  onOpenChange,
  education,
}: EducationDialogProps) {
  const form = useForm<MemberEducationInput>({
    resolver: zodResolver(memberEducationSchema),
    defaultValues: toFormValues(education),
  })

  useEffect(() => {
    form.reset(toFormValues(education))
  }, [education, form])

  const addMutation = useAddEducation()
  const updateMutation = useUpdateEducation()
  const isPending = addMutation.isPending || updateMutation.isPending

  function onSubmit(values: MemberEducationInput) {
    const mutation = education ? updateMutation : addMutation
    mutation.mutate(values, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {education ? "Sửa học vấn" : "Thêm học vấn"}
          </DialogTitle>
          <DialogDescription>
            Trường học, chuyên ngành và thời gian học
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="schoolName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên trường</FormLabel>
                  <FormControl>
                    <Input {...field} className="h-10 rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="degree"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bằng cấp</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        className="h-10 rounded-xl"
                        placeholder="Cử nhân"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fieldOfStudy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chuyên ngành</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        className="h-10 rounded-xl"
                        placeholder="Công nghệ thông tin"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bắt đầu</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        type="month"
                        className="h-10 rounded-xl"
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
                    <FormLabel>Kết thúc</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        type="month"
                        className="h-10 rounded-xl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả (tùy chọn)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      rows={3}
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
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-lg"
              >
                {isPending ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
