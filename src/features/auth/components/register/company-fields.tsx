"use client"

import {
  AtSign,
  Briefcase,
  Building2,
  FileBadge,
  FileText,
  Globe,
  Info,
  Layers,
  MapPin,
  Phone,
  UserSquare,
  Users,
} from "lucide-react"
import { useTranslations } from "next-intl"
import type { Control } from "react-hook-form"

import {
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
import { Textarea } from "@/components/ui/textarea"

import { COMPANY_SIZE_OPTIONS } from "../../schemas"
import type { RegisterFormValues } from "../register-form"

export function CompanyFields({
  control,
  inputClass,
}: {
  control: Control<RegisterFormValues>
  inputClass: string
}) {
  const t = useTranslations("auth.register")
  const tSize = useTranslations("auth.register.sizeOptions")

  return (
    <>
      <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-xs leading-relaxed text-foreground/80 flex gap-2">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
        <span>{t("companyPendingNotice")}</span>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("companyInfoSection")}
        </p>

        <FormField
          control={control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-foreground/80">
                {t("companyName")}
              </FormLabel>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Briefcase className="w-5 h-5" />
                </span>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="organization"
                    placeholder={t("companyNamePlaceholder")}
                    className={inputClass}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="taxId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-foreground/80">
                {t("taxId")}
              </FormLabel>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                  <FileBadge className="w-5 h-5" />
                </span>
                <FormControl>
                  <Input
                    {...field}
                    inputMode="numeric"
                    placeholder={t("taxIdPlaceholder")}
                    className={inputClass}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            control={control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-foreground/80">
                  {t("industry")}
                </FormLabel>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Building2 className="w-5 h-5" />
                  </span>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("industryPlaceholder")}
                      className={inputClass}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="size"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-foreground/80">
                  {t("size")}
                </FormLabel>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground z-10">
                    <Users className="w-5 h-5" />
                  </span>
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger
                        className={`${inputClass} w-full text-left`}
                      >
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
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="businessAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-foreground/80">
                {t("businessAddress")}
              </FormLabel>
              <div className="relative group">
                <span className="absolute top-3 left-0 pl-3.5 flex items-start pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                  <MapPin className="w-5 h-5" />
                </span>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={2}
                    placeholder={t("businessAddressPlaceholder")}
                    className="pl-11 pt-3 bg-card border-border hover:bg-muted/30 transition-all duration-300 focus:bg-card focus:ring-1 focus:ring-primary/50 focus:border-primary rounded-xl resize-none"
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="businessEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-foreground/80">
                {t("businessEmail")}
              </FormLabel>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                  <AtSign className="w-5 h-5" />
                </span>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder={t("businessEmailPlaceholder")}
                    className={inputClass}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            control={control}
            name="representativeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-foreground/80">
                  {t("representativeName")}
                </FormLabel>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                    <UserSquare className="w-5 h-5" />
                  </span>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="name"
                      placeholder={t("representativeNamePlaceholder")}
                      className={inputClass}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="representativeTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-foreground/80">
                  {t("representativeTitle")}
                </FormLabel>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Layers className="w-5 h-5" />
                  </span>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("representativeTitlePlaceholder")}
                      className={inputClass}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            control={control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-foreground/80">
                  {t("website")}
                </FormLabel>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Globe className="w-5 h-5" />
                  </span>
                  <FormControl>
                    <Input
                      {...field}
                      inputMode="url"
                      placeholder={t("websitePlaceholder")}
                      className={inputClass}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-foreground/80">
                  {t("phone")}
                </FormLabel>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Phone className="w-5 h-5" />
                  </span>
                  <FormControl>
                    <Input
                      {...field}
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder={t("phonePlaceholder")}
                      className={inputClass}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="about"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-foreground/80">
                {t("about")}
              </FormLabel>
              <div className="relative group">
                <span className="absolute top-3 left-0 pl-3.5 flex items-start pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                  <FileText className="w-5 h-5" />
                </span>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={3}
                    placeholder={t("aboutPlaceholder")}
                    className="pl-11 pt-3 bg-card border-border hover:bg-muted/30 transition-all duration-300 focus:bg-card focus:ring-1 focus:ring-primary/50 focus:border-primary rounded-xl resize-none"
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-2">
        {t("companyAccountSection")}
      </p>
    </>
  )
}
