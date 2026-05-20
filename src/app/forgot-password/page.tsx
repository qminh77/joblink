"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form"

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 },
  },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.98 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center font-body text-foreground relative overflow-hidden bg-background">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none z-0"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none z-0"
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0" />

      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="show"
        className="relative z-20 w-full max-w-[440px] mx-4"
      >
        <div className="bg-card/90 dark:bg-card/50 backdrop-blur-3xl border border-border/80 rounded-3xl p-8 sm:p-10">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center"
          >
            <motion.div variants={fadeUp} className="mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://emmariani.github.io/cartoon-hero/img/mode.jpg"
                alt="JobLink"
                className="w-14 h-14 rounded-2xl object-cover border border-primary/20"
              />
            </motion.div>

            <motion.div variants={fadeUp} className="text-center mb-8">
              <h1 className="text-2xl font-headline font-extrabold tracking-tight mb-2">
                Quên mật khẩu?
              </h1>
              <p className="text-muted-foreground text-sm">
                Nhập email của bạn để nhận liên kết khôi phục
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="w-full">
              <ForgotPasswordForm />
            </motion.div>

            <motion.div variants={fadeUp} className="mt-8 w-full">
              <Link
                href="/login"
                className="flex items-center justify-center text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại đăng nhập
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
