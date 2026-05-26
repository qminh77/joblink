"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { useTranslations } from "next-intl"
import {
  AtSign,
  Briefcase,
  Building2,
  FileBadge,
  Info,
  Layers,
  Lock,
  Mail,
  MapPin,
  User,
  UserSquare,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

import { useRegister } from "../hooks"
import {
  COMPANY_SIZE_OPTIONS,
  createRegisterSchema,
  type CompanySize,
  type RegisterInput,
} from "../schemas"

import { PasswordInput } from "./password-input"

type RegisterFormValues = {
  role: "member" | "company"
  fullName: string
  companyName: string
  taxId: string
  industry: string
  size: CompanySize | ""
  representativeName: string
  representativeTitle: string
  businessAddress: string
  businessEmail: string
  email: string
  password: string
  acceptTerms: boolean
}

const defaultValues: RegisterFormValues = {
  role: "member",
  fullName: "",
  companyName: "",
  taxId: "",
  industry: "",
  size: "",
  representativeName: "",
  representativeTitle: "",
  businessAddress: "",
  businessEmail: "",
  email: "",
  password: "",
  acceptTerms: false,
}

const INPUT_CLASS =
  "pl-11 h-12 bg-white dark:bg-background border-border hover:bg-muted/30 transition-all duration-300 focus:bg-background focus:ring-1 focus:ring-primary/50 focus:border-primary rounded-xl"

export function RegisterForm() {
  const t = useTranslations("auth.register")
  const tv = useTranslations("auth.validation")
  const tSize = useTranslations("auth.register.sizeOptions")
  const registerSchema = useMemo(() => createRegisterSchema(tv), [tv])

  const form = useForm<RegisterFormValues>({
    defaultValues,
    resolver: async (values) => {
      const payload: RegisterInput =
        values.role === "company"
          ? {
              role: "company",
              companyName: values.companyName,
              taxId: values.taxId,
              industry: values.industry,
              size: values.size as CompanySize,
              representativeName: values.representativeName,
              representativeTitle: values.representativeTitle || undefined,
              businessAddress: values.businessAddress,
              businessEmail: values.businessEmail,
              email: values.email,
              password: values.password,
              acceptTerms: values.acceptTerms as true,
            }
          : {
              role: "member",
              fullName: values.fullName,
              email: values.email,
              password: values.password,
              acceptTerms: values.acceptTerms as true,
            }

      const result = registerSchema.safeParse(payload)
      if (result.success) return { values, errors: {} }

      const errors: Record<string, { type: string; message: string }> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0]
        if (typeof key === "string" && !(key in errors)) {
          errors[key] = { type: "validate", message: issue.message }
        }
      }
      return { values: {}, errors }
    },
  })

  const role = form.watch("role")
  const register = useRegister()

  useEffect(() => {
    form.clearErrors()
  }, [role, form])

  function onSubmit(values: RegisterFormValues) {
    const payload: RegisterInput =
      values.role === "company"
        ? {
            role: "company",
            companyName: values.companyName,
            taxId: values.taxId,
            industry: values.industry,
            size: values.size as CompanySize,
            representativeName: values.representativeName,
            representativeTitle: values.representativeTitle || undefined,
            businessAddress: values.businessAddress,
            businessEmail: values.businessEmail,
            email: values.email,
            password: values.password,
            acceptTerms: true,
          }
        : {
            role: "member",
            fullName: values.fullName,
            email: values.email,
            password: values.password,
            acceptTerms: true,
          }
    register.mutate(payload)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <Tabs
                value={field.value}
                onValueChange={(value) =>
                  field.onChange(value as "member" | "company")
                }
                className="w-full mb-2"
              >
                <TabsList className="grid w-full grid-cols-2 bg-muted h-11 border border-border/80 rounded-xl p-1">
                  <TabsTrigger
                    value="member"
                    className="w-full h-full rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {t("asMember")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="company"
                    className="w-full h-full rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {t("asCompany")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </FormItem>
          )}
        />

        {role === "member" ? (
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-foreground/80">
                  {t("fullName")}
                </FormLabel>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                    <User className="w-5 h-5" />
                  </span>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="name"
                      placeholder={t("fullNamePlaceholder")}
                      className={INPUT_CLASS}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
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
                control={form.control}
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
                          className={INPUT_CLASS}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
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
                          className={INPUT_CLASS}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
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
                            className={INPUT_CLASS}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
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
                              className={`${INPUT_CLASS} w-full text-left`}
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
                control={form.control}
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
                          className="pl-11 pt-3 bg-white dark:bg-background border-border hover:bg-muted/30 transition-all duration-300 focus:bg-background focus:ring-1 focus:ring-primary/50 focus:border-primary rounded-xl resize-none"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
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
                          className={INPUT_CLASS}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
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
                            className={INPUT_CLASS}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
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
                            className={INPUT_CLASS}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-2">
              {t("companyAccountSection")}
            </p>
          </>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-foreground/80">
                {t("email")}
              </FormLabel>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Mail className="w-5 h-5" />
                </span>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    autoComplete="email"
                    placeholder="name@company.com"
                    className={INPUT_CLASS}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-foreground/80">
                {t("password")}
              </FormLabel>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors z-10">
                  <Lock className="w-5 h-5" />
                </span>
                <FormControl>
                  <PasswordInput
                    {...field}
                    autoComplete="new-password"
                    placeholder={t("passwordPlaceholder")}
                    className={INPUT_CLASS}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="acceptTerms"
          render={({ field }) => (
            <FormItem className="flex items-start space-x-3 pt-2 pb-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-0.5 rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              </FormControl>
              <div className="space-y-1">
                <FormLabel className="text-sm font-medium text-muted-foreground cursor-pointer leading-relaxed">
                  {t("acceptTermsPrefix")}{" "}
                  <Link
                    href="#"
                    className="text-primary hover:text-primary/80 transition-colors font-semibold"
                  >
                    {t("termsOfService")}
                  </Link>{" "}
                  {t("and")}{" "}
                  <Link
                    href="#"
                    className="text-primary hover:text-primary/80 transition-colors font-semibold"
                  >
                    {t("privacyPolicy")}
                  </Link>
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={register.isPending}
          className="w-full h-12 text-base font-semibold hover:opacity-90 transition-opacity duration-300 rounded-xl"
        >
          {register.isPending
            ? t("submitting")
            : role === "company"
              ? t("submitCompany")
              : t("submitMember")}
        </Button>
      </form>
    </Form>
  )
}
