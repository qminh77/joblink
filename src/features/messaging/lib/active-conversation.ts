"use client"

/**
 * Module-level mutable state cho conversation đang mở trên UI.
 *
 * Mục đích: khi realtime nhận tin mới hoặc khi NotificationDropdown render,
 * cần biết user có đang mở conversation đó hay không để tắt toast / không bật
 * thông báo (chống spam + giảm load không cần thiết).
 *
 * Không dùng Context để tránh re-render mọi consumer khi đổi convo (kiểm tra
 * này chạy trong realtime callback, không cần phản hồi reactive).
 */
let activeConversationId: number | null = null

export function setActiveConversation(conversationId: number | null): void {
  activeConversationId = conversationId
}

export function getActiveConversationId(): number | null {
  return activeConversationId
}

export function isConversationActive(conversationId: number): boolean {
  return activeConversationId === conversationId
}

/**
 * Tab visibility: dùng kết hợp với active conversation để quyết định bật toast.
 * Khi tab ẩn (background), vẫn cần tăng badge nhưng không bật toast âm thanh.
 */
export function isDocumentVisible(): boolean {
  if (typeof document === "undefined") return true
  return document.visibilityState === "visible"
}
