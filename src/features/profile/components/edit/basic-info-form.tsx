"use client"

import { useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { useTranslations } from "next-intl"

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
import { LocationSelect } from "@/features/locations/components/location-select"
import { PROFILE_VISIBILITIES } from "@/features/profile/lib/constants"
import {
  createMemberProfileSchema,
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
  const tCommon = useTranslations("common")
  const t = useTranslations("profile.basic")
  const tv = useTranslations("profile.validation")
  const tVisibility = useTranslations("profile.visibility")

  const schema = useMemo(() => createMemberProfileSchema(tv), [tv])
  const form = useForm<MemberProfileInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: profile.full_name,
      headline: profile.headline ?? "",
      about: profile.about ?? "",
      website: profile.website ?? "",
      provinceId: profile.province?.id ?? null,
      wardId: profile.ward?.id ?? null,
      profileVisibility: profile.profile_visibility,
      openToWork: profile.open_to_work,
    },
  })

  const updateProfile = useUpdateMemberProfile()
  const provinceId = useWatch({ control: form.control, name: "provinceId" })
  const wardId = useWatch({ control: form.control, name: "wardId" })

  function onSubmit(values: MemberProfileInput) {
    updateProfile.mutate(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("fullName")}</FormLabel>
                <FormControl>
                  <Input {...field} className="h-10 rounded-xl" />
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
                <FormLabel>{t("headline")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="h-10 rounded-xl"
                    placeholder={t("headlinePlaceholder")}
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
                <FormLabel>{t("website")}</FormLabel>
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

          <div className="md:col-span-2">
            <LocationSelect
              provinces={provinces}
              value={{ provinceId: provinceId ?? null, wardId: wardId ?? null }}
              initialWardName={profile.ward?.name}
              onChange={({ provinceId, wardId }) => {
                form.setValue("provinceId", provinceId, { shouldDirty: true })
                form.setValue("wardId", wardId, { shouldDirty: true })
              }}
            />
          </div>

          <FormField
            control={form.control}
            name="profileVisibility"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("visibility")}</FormLabel>
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
                        {tVisibility(value)}
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
              <FormLabel>{t("about")}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  rows={5}
                  placeholder={t("aboutPlaceholder")}
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
                <FormLabel className="text-sm">{t("openToWork")}</FormLabel>
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
            {updateProfile.isPending
              ? tCommon("saving")
              : tCommon("saveChanges")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
