export const SETTING_GROUPS: Record<string, string[]> = {
  regional: [
    "default_locale",
    "default_timezone",
    "default_currency",
    "available_locales",
  ],
  smtp: [
    "smtp_host",
    "smtp_port",
    "smtp_username",
    "smtp_password",
    "smtp_encryption",
    "smtp_from_email",
    "smtp_from_name",
  ],
  recaptcha: ["recaptcha_enabled", "recaptcha_site_key", "recaptcha_secret"],
  security: [
    "login_rate_limit",
    "upload_max_mb",
    "require_2fa_admin",
    "google_auth_enabled",
    "require_email_verification",
    "passkey_enabled",
  ],
  contact: [
    "contact_address",
    "contact_email",
    "contact_phone",
    "contact_content",
    "contact_map_url",
  ],
}

export const ALLOWED_SETTING_KEYS = new Set<string>(
  Object.values(SETTING_GROUPS).flat(),
)
