"use client"

import { motion } from "framer-motion"
import { pageEntrance, staggerSm, fadeUp, slideLeft, slideRight, btnTap } from "@/lib/animations"
import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import {
  Search, Send, MoreHorizontal, Phone, Video,
  Smile, Paperclip, Check, CheckCheck,
  ArrowLeft,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"

interface Message {
  id: number
  sender: "me" | "them"
  text: string
  time: string
  seen?: boolean
}

interface Conversation {
  id: number
  name: string
  initials: string
  title: string
  online: boolean
  lastMessage: string
  lastTime: string
  unread: number
  messages: Message[]
}

const conversations: Conversation[] = [
  {
    id: 1, name: "Trần Hoàng", initials: "TH", title: "Product Manager tại VNG",
    online: true, lastMessage: "Chắc chắn rồi, tôi sẽ gửi bạn thông tin chi tiết.", lastTime: "2 phút trước",
    unread: 2,
    messages: [
      { id: 1, sender: "them", text: "Chào Mai, bạn có rảnh không? Mình muốn trao đổi về dự án mới.", time: "10:23" },
      { id: 2, sender: "me", text: "Chào bạn, mình rảnh bạn nhé! Bạn cần trao đổi gì ạ?", time: "10:25" },
      { id: 3, sender: "them", text: "Tuyệt! Bên mình đang có một vị trí Senior UX Designer. Bạn có quan tâm không?", time: "10:26" },
      { id: 4, sender: "me", text: "Ồ, thú vị đấy! Bạn có thể cho mình xem JD được không?", time: "10:28" },
      { id: 5, sender: "them", text: "Chắc chắn rồi, tôi sẽ gửi bạn thông tin chi tiết.", time: "10:30", seen: true },
    ],
  },
  {
    id: 2, name: "Lê Vy", initials: "LV", title: "Recruiter tại FPT Software",
    online: false, lastMessage: "Cảm ơn bạn, tôi sẽ xem xét!", lastTime: "1 giờ trước",
    unread: 0,
    messages: [
      { id: 1, sender: "them", text: "Chào chị Mai, em là Vy bên FPT Software ạ.", time: "09:00" },
      { id: 2, sender: "them", text: "Bên em đang có vị trí UX Lead, chị có quan tâm không ạ?", time: "09:01" },
      { id: 3, sender: "me", text: "Chào Vy, cảm ơn em đã liên hệ. Chị sẽ xem thông tin nhé!", time: "09:15" },
      { id: 4, sender: "them", text: "Dạ vâng ạ, em gửi chị JD qua email nhé?", time: "09:16" },
      { id: 5, sender: "me", text: "Cảm ơn bạn, tôi sẽ xem xét!", time: "09:30" },
    ],
  },
  {
    id: 3, name: "Phạm Minh", initials: "PM", title: "Fullstack Developer tại VNPT",
    online: true, lastMessage: "Đã nhận được file rồi, cảm ơn bạn!", lastTime: "30 phút trước",
    unread: 0,
    messages: [
      { id: 1, sender: "me", text: "Mình gửi bạn file design mới nhất nhé!", time: "14:00" },
      { id: 2, sender: "them", text: "Ok bạn, gửi đi ạ!", time: "14:02" },
      { id: 3, sender: "me", text: "Đã gửi qua email rồi đó.", time: "14:05" },
      { id: 4, sender: "them", text: "Đã nhận được file rồi, cảm ơn bạn!", time: "14:10" },
    ],
  },
  {
    id: 4, name: "Hoàng Yến", initials: "HY", title: "Marketing Lead tại Shopee",
    online: false, lastMessage: "Hẹn gặp bạn tuần sau nhé!", lastTime: "Hôm qua",
    unread: 1,
    messages: [
      { id: 1, sender: "them", text: "Chào Mai, tuần sau bọn mình có event, bạn có tham gia không?", time: "20:00" },
      { id: 2, sender: "me", text: "Chắc chắn rồi! Mình rất muốn tham gia!", time: "20:15" },
      { id: 3, sender: "them", text: "Hẹn gặp bạn tuần sau nhé!", time: "20:16" },
    ],
  },
  {
    id: 5, name: "Đỗ Văn", initials: "ĐV", title: "CTO tại TechStartup",
    online: true, lastMessage: "OK, deal nhé!", lastTime: "3 giờ trước",
    unread: 0,
    messages: [
      { id: 1, sender: "them", text: "Mình đồng ý với đề xuất của bạn.", time: "15:30" },
      { id: 2, sender: "me", text: "Tuyệt vời! Cảm ơn bạn.", time: "15:35" },
      { id: 3, sender: "them", text: "OK, deal nhé!", time: "15:36" },
    ],
  },
]

export default function MessagesPage() {
  const t = useTranslations("messages")
  const tCommon = useTranslations("common")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [messageText, setMessageText] = useState("")
  const [conversationsList, setConversationsList] = useState(conversations)
  const [showMobileList, setShowMobileList] = useState(true)

  const selected = conversationsList.find(c => c.id === selectedId)

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || !selectedId) return
    const now = tCommon("justNow")
    setConversationsList(prev => prev.map(c => {
      if (c.id !== selectedId) return c
      return {
        ...c,
        messages: [...c.messages, { id: Date.now(), sender: "me", text: messageText, time: now, seen: false }],
        lastMessage: messageText,
        lastTime: now,
      }
    }))
    setMessageText("")
  }

  const handleSelectConversation = (id: number) => {
    setSelectedId(id)
    setShowMobileList(false)
    setConversationsList(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c))
  }

  return (
    <motion.div variants={pageEntrance} initial="hidden" animate="show" className="h-[calc(100vh-7rem)] flex gap-0">
      {/* Conversation List */}
      <motion.div variants={slideLeft} initial="hidden" animate="show" className={`${selectedId && !showMobileList ? "hidden" : "flex"} md:flex w-full md:w-80 lg:w-96 shrink-0 flex-col bg-card border border-border/40 rounded-2xl overflow-hidden`}>
        <div className="p-4 border-b border-border/40">
          <h1 className="font-headline font-bold text-xl">{t("title")}</h1>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9 h-9 rounded-full bg-muted border-none text-sm" placeholder={t("searchPlaceholder")} />
          </div>
        </div>
        <motion.div variants={staggerSm} initial="hidden" animate="show" className="flex-1 overflow-y-auto">
          {conversationsList.map((conv) => (
            <motion.div variants={fadeUp} key={conv.id}>
            <button
              onClick={() => handleSelectConversation(conv.id)}
              className={`w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left border-b border-border/20 last:border-b-0 ${selectedId === conv.id ? "bg-primary/5" : ""}`}
            >
              <div className="relative shrink-0">
                <Avatar className="w-11 h-11"><AvatarFallback>{conv.initials}</AvatarFallback></Avatar>
                {conv.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-card rounded-full"></span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm truncate">{conv.name}</h3>
                  <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{conv.lastTime}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center shrink-0">{conv.unread}</span>
              )}
            </button>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Chat Panel */}
      <div className={`${!selectedId || showMobileList ? "hidden md:flex" : "flex"} flex-1 flex-col bg-card border border-border/40 rounded-2xl overflow-hidden ml-0 md:ml-3`}>
        {selected ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-3 px-4 border-b border-border/40 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button className="md:hidden p-1 hover:bg-muted rounded-full" onClick={() => setShowMobileList(true)}>
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <Link href={`/profile/${selected.id}`}>
                  <Avatar className="w-9 h-9 cursor-pointer hover:opacity-80">

                    <AvatarFallback>{selected.initials}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="min-w-0">
                  <Link href={`/profile/${selected.id}`} className="font-semibold text-sm hover:text-primary transition-colors truncate block">{selected.name}</Link>
                  <span className={`text-[11px] ${selected.online ? "text-emerald-500" : "text-muted-foreground"}`}>
                    {selected.online ? t("online") : t("offline")}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"><Phone className="w-4 h-4" /></button>
                <button className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"><Video className="w-4 h-4" /></button>
                <button className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"><MoreHorizontal className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Messages */}
            <motion.div variants={staggerSm} initial="hidden" animate="show" className="flex-1 overflow-y-auto p-4 space-y-3">
              {selected.messages.map((msg) => (
                <motion.div variants={msg.sender === "me" ? slideRight : slideLeft} key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] sm:max-w-[60%] ${msg.sender === "me" ? "order-1" : "order-1"}`}>
                    {msg.sender === "them" && (
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="w-5 h-5"><AvatarFallback className="text-[9px]">{selected.initials}</AvatarFallback></Avatar>
                        <span className="text-[10px] text-muted-foreground">{selected.name}</span>
                      </div>
                    )}
                    <div className={`rounded-2xl px-3.5 py-2 text-sm inline-block ${
                      msg.sender === "me"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted border border-border/40 rounded-bl-md"
                    }`}>
                      {msg.text}
                    </div>
                    <div className={`flex items-center gap-1 mt-0.5 ${msg.sender === "me" ? "justify-end" : "justify-start"} px-1`}>
                      <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                      {msg.sender === "me" && (
                        msg.seen ? <CheckCheck className="w-3 h-3 text-primary" /> : <Check className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

            {/* Input */}
            <motion.div variants={fadeUp} initial="hidden" animate="show">
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border/40 shrink-0 flex items-center gap-2">
              <button type="button" className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"><Paperclip className="w-4 h-4" /></button>
              <div className="flex-1 flex items-center bg-muted rounded-full px-4 focus-within:ring-1 focus-within:ring-primary transition-all">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={t("inputPlaceholder")}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2.5 outline-none"
                />
                <button type="button" className="p-1 text-muted-foreground hover:text-foreground"><Smile className="w-4 h-4" /></button>
              </div>
              <motion.button type="submit" disabled={!messageText.trim()} {...btnTap} className="p-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                <Send className="w-4 h-4" />
              </motion.button>
            </form>
            </motion.div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Send className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-headline font-bold text-lg text-foreground">{t("emptyTitle")}</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {t("emptyDesc")}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
