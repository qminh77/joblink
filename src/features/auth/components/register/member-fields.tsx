"use client"

import { User } from "lucide-react"
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
import type { RegisterFormValues } from "../register-form"

export function MemberFields({
  control,
  inputClass,
}: {
  control: Control<RegisterFormValues>
  inputClass: string
}) {
  const t = useTranslations("auth.register")

  return (
    <FormField
      control={control}
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
                className={inputClass}
              />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
