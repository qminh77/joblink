import "server-only"

export type { AuthMailLocale } from "../services/auth-mailer.service"
export {
  createUserAndSendVerification,
  sendEmailChangeVerification,
  sendPasswordResetEmail,
} from "../services/auth-mailer.service"
