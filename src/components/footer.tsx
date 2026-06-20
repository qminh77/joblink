import Link from "next/link"
import { Mail, MapPin, Phone } from "lucide-react"

import { loadPublicContactSettings } from "@/features/system-settings/api/public-settings"

export async function Footer() {
  const contact = await loadPublicContactSettings()
  const hasContact = contact.email || contact.phone || contact.address

  return (
    <footer className="border-t border-border/30 bg-background mt-auto">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-3">
            <h3 className="font-bold text-lg">Joblink</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Nền tảng kết nối việc làm và tuyển dụng hàng đầu Việt Nam.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Điều hướng
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/jobs" className="text-muted-foreground hover:text-foreground transition-colors">
                  Việc làm
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Liên hệ hỗ trợ
                </Link>
              </li>
            </ul>
          </div>

          {hasContact ? (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                Liên hệ
              </h4>
              <ul className="space-y-2 text-sm">
                {contact.email ? (
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4 shrink-0" />
                    <a href={`mailto:${contact.email}`} className="hover:text-foreground transition-colors">
                      {contact.email}
                    </a>
                  </li>
                ) : null}
                {contact.phone ? (
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4 shrink-0" />
                    <a href={`tel:${contact.phone}`} className="hover:text-foreground transition-colors">
                      {contact.phone}
                    </a>
                  </li>
                ) : null}
                {contact.address ? (
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{contact.address}</span>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="border-t border-border/20 mt-8 pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Joblink. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
