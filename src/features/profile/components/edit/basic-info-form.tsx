"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  PROFILE_VISIBILITIES,
  PROFILE_VISIBILITY_LABELS,
} from "@/features/profile/lib/constants"
import {
  memberProfileSchema,
  type MemberProfileInput,
} from "@/features/profile/schemas"
import type { MemberProfileDetail } from "@/features/profile/types"
import type { ProvinceRow } from "@/types/database"

import { useUpdateMemberProfile } from "@/features/profile/hooks"

export function BasicInfoForm({
  profile,
  provinces,
}: {
  profile: MemberProfileDetail
  provinces: ProvinceRow[]
}) {
  const form = useForm<MemberProfileInput>({
    resolver: zodResolver(memberProfileSchema),
    defaultValues: {
      fullName: profile.full_name,
      headline: profile.headline ?? "",
      about: profile.about ?? "",
      avatarUrl: profile.avatar_url ?? "",
      website: profile.website ?? "",
      provinceId: profile.province?.id ?? null,
      districtId: profile.district?.id ?? null,
      profileVisibility: profile.profile_visibility,
      openToWork: profile.open_to_work,
    },
  })

  const updateProfile = useUpdateMemberProfile()

  function onSubmit(values: MemberProfileInput) {
    updateProfile.mutate(values)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Họ và tên</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="h-10 rounded-xl"
                    placeholder="Nguyễn Văn A"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="headline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chức danh</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="h-10 rounded-xl"
                    placeholder="Senior UX Designer"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="avatarUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL ảnh đại diện</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="h-10 rounded-xl"
                    placeholder="https://..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website / Portfolio</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="h-10 rounded-xl"
                    placeholder="https://..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="provinceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tỉnh / Thành phố</FormLabel>
                <Select
                  value={field.value ? String(field.value) : "none"}
                  onValueChange={(value) =>
                    field.onChange(value === "none" ? null : Number(value))
                  }
                >
                  <FormControl>
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue placeholder="Chọn tỉnh / thành" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">— Không xác định —</SelectItem>
                    {provinces.map((province) => (
                      <SelectItem key={province.id} value={String(province.id)}>
                        {province.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="profileVisibility"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quyền riêng tư hồ sơ</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) =>
                    field.onChange(
                      value as MemberProfileInput["profileVisibility"],
                    )
                  }
                >
                  <FormControl>
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROFILE_VISIBILITIES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {PROFILE_VISIBILITY_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="about"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Giới thiệu bản thân</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  rows={5}
                  placeholder="Mô tả ngắn về bạn, kinh nghiệm và mục tiêu nghề nghiệp"
                  className="rounded-xl"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="openToWork"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-xl border border-border/40 px-4 py-3">
              <div className="space-y-1 pr-4">
                <FormLabel className="text-sm">Đang tìm việc</FormLabel>
                <p className="text-xs text-muted-foreground">
                  Hiển thị badge &ldquo;Đang tìm việc&rdquo; trên hồ sơ và cho phép
                  nhà tuyển dụng lọc bạn vào danh sách ứng viên.
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            disabled={updateProfile.isPending}
            className="rounded-lg"
          >
            {updateProfile.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
