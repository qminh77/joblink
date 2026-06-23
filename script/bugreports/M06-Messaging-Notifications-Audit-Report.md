# Báo cáo rà soát Module M06 (Tin nhắn và Thông báo)

**Ngày thực hiện**: 2026-06-23
**Người rà soát**: Antigravity
**Module**: M06 - Tin nhắn và Thông báo (UC-43 đến UC-45)

## Kết quả rà soát
Kiểm tra `src/features/messaging/api/actions.ts` và `src/features/notifications/api/actions.ts`:
- **FR-M06-001 (Nhắn tin)**: Sử dụng RPC `find_or_create_direct_conversation` và `send_message` trên Supabase (Security Definer) để đảm bảo toàn vẹn dữ liệu. Rate limit 30 messages/60s. Có gửi notification realtime qua cơ chế `notifyNewMessage`.
- **FR-M06-002 (Đọc tin nhắn)**: Hàm `markConversationReadAction` gọi RPC `mark_conversation_read` và tự động clear notification.
- **FR-M06-003 (Thông báo)**: Đầy đủ các hành động đọc thông báo (`markNotificationReadAction`, `markAllNotificationsReadAction`).
- **FR-M06-004 (Cấu hình thông báo)**: Hàm `updateNotificationPreferenceAction` hỗ trợ cập nhật cấu hình in-app và email notification theo tùy chọn người dùng (UC-65).

## Bugs / Issues
**Không có lỗi (No bugs found)**.
- RPC xử lý rất sạch sẽ, tránh được các vấn đề concurrency/race condition khi tạo conversation.
- Cơ chế gộp (batching) new_message notification rất tối ưu.

## Đề xuất cải tiến
- Đối với `sendMessageAction`, nếu user gửi tin nhắn chứa các nội dung không phù hợp (từ khóa cấm), có thể tích hợp AI/Regex Filter trước khi gọi RPC.
