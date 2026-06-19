"use client"

import { useEffect } from "react"

import { setActiveConversation } from "../lib/active-conversation"

export function useActiveConversation(conversationId: number | null) {
  useEffect(() => {
    setActiveConversation(conversationId)
    return () => setActiveConversation(null)
  }, [conversationId])
}
