import { z } from "zod"

export const contactFormSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập họ tên").max(255),
  email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
  subject: z.string().max(255).default(""),
  message: z.string().min(1, "Vui lòng nhập nội dung").max(5000),
})

export type ContactFormInput = z.infer<typeof contactFormSchema>

export const contactReplySchema = z.object({
  id: z.number(),
  replyMessage: z.string().min(1, "reply_required").max(10000),
})

export type ContactReplyInput = z.infer<typeof contactReplySchema>
