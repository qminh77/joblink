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
import { LocationSelect } from "@/components/common/location-select"
import { COMPANY_SIZE_OPTIONS } from "@/features/auth/schemas"
import {
  createCompanyProfileSchema,
  type CompanyProfileInput,
} from "@/features/profile/schemas"
import type { CompanyProfileDetail } from "@/features/profile/types"
import type { ProvinceRow } from "@/types/database"

import { useUpdateCompanyProfile } from "@/features/profile/hooks"
import { CompanyAvatarCoverEditor } from "./company-avatar-cover-editor"

export function CompanyInfoForm({
  company,
  provinces,
}: {
  company: CompanyProfileDetail
  provinces: ProvinceRow[]
}) {
  const tCommon = useTranslations("common")
  const t = useTranslations("profile.company")
  const tSize = useTranslations("auth.register.sizeOptions")
  const tv = useTranslations("profile.validation")

  const schema = useMemo(() => createCompanyProfileSchema(tv), [tv])
  const form = useForm<CompanyProfileInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: company.name,
      about: company.about ?? "",
      logoUrl: company.logo_url ?? "",
      coverUrl: company.cover_url ?? "",
      website: company.website ?? "",
      phone: company.phone ?? "",
      industry: company.industry ?? "",
      size: company.size ?? "",
      provinceId: company.province?.id ?? null,
      wardId: company.ward?.id ?? null,
      openToHire: company.open_to_hire,
      businessAddress: company.business_address ?? "",
      businessEmail: company.business_email ?? "",
      representativeName: company.representative_name ?? "",
      representativeTitle: company.representative_title ?? "",
      taxId: company.tax_id ?? "",
    },
  })

  const updateProfile = useUpdateCompanyProfile()
  const provinceId = useWatch({ control: form.control, name: "provinceId" })
  const wardId = useWatch({ control: form.control, name: "wardId" })

  function onSubmit(values: CompanyProfileInput) {
    updateProfile.mutate(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <CompanyAvatarCoverEditor
          userId={company.user_id}
          companyName={company.name}
          logoUrl={company.logo_url}
          coverUrl={company.cover_url}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("name")}</FormLabel>
              <FormControl>
                <Input {...field} className="h-10 rounded-xl" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("phone")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    inputMode="tel"
                    className="h-10 rounded-xl"
                    placeholder={t("phonePlaceholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="businessEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("businessEmail")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="email"
                    className="h-10 rounded-xl"
                    placeholder="contact@company.com"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("industry")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="h-10 rounded-xl"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("size")}</FormLabel>
                <Select
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="h-10 rounded-xl w-full">
                      <SelectValue placeholder={t("sizePlaceholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COMPANY_SIZE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {tSize(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-2">
            <LocationSelect
              provinces={provinces}
              value={{ provinceId: provinceId ?? null, wardId: wardId ?? null }}
              initialWardName={company.ward?.name}
              onChange={({ provinceId, wardId }) => {
                form.setValue("provinceId", provinceId, { shouldDirty: true })
                form.setValue("wardId", wardId, { shouldDirty: true })
              }}
            />
          </div>

          <FormField
            control={form.control}
            name="taxId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("taxId")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
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
          name="businessAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("businessAddress")}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  rows={2}
                  className="rounded-xl"
                  placeholder={t("businessAddressPlaceholder")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="representativeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("representativeName")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="h-10 rounded-xl"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="representativeTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("representativeTitle")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    className="h-10 rounded-xl"
                    placeholder={t("representativeTitlePlaceholder")}
                  />
                </FormControl>
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
          name="openToHire"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-xl border border-border/40 px-4 py-3">
              <div className="space-y-1 pr-4">
                <FormLabel className="text-sm">{t("openToHire")}</FormLabel>
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
