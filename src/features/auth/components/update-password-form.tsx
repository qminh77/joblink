"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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

import { useUpdatePassword } from "../hooks"
import {
  createUpdatePasswordSchema,
  type UpdatePasswordInput,
} from "../schemas"
import { PasswordInput } from "./password-input"

export function UpdatePasswordForm() {
  const tAuth = useTranslations("auth.forgotPassword")
  const tSet = useTranslations("settings.password")
  const tv = useTranslations("auth.validation")

  const form = useForm<UpdatePasswordInput>({
    resolver: zodResolver(createUpdatePasswordSchema(tv)),
    defaultValues: { password: "", confirmPassword: "" },
  })

  const updatePassword = useUpdatePassword()

  function onSubmit(values: UpdatePasswordInput) {
    updatePassword.mutate(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-foreground/80">
                {tSet("new")}
              </FormLabel>
              <FormControl>
                <PasswordInput
                  {...field}
                  autoComplete="new-password"
                  placeholder="********"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-foreground/80">
                {tSet("confirmNew")}
              </FormLabel>
              <FormControl>
                <PasswordInput
                  {...field}
                  autoComplete="new-password"
                  placeholder="********"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={updatePassword.isPending}
          className="w-full h-12 text-base font-semibold hover:opacity-90 transition-opacity duration-300 rounded-xl"
        >
          {updatePassword.isPending ? tAuth("submitting") : tAuth("submit")}
        </Button>
      </form>
    </Form>
  )
}
