export const SETTING_GROUPS: Record<string, string[]> = {
  site_identity: [
    "site_name",
    "site_description",
    "site_logo_url",
    "site_favicon_url",
  ],
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
  security: ["login_rate_limit", "upload_max_mb", "require_2fa_admin"],
}

export const ALLOWED_SETTING_KEYS = new Set<string>(
  Object.values(SETTING_GROUPS).flat(),
)
