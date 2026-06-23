# Báo cáo rà soát Module M03 (Bảng tin xã hội)

**Ngày thực hiện**: 2026-06-23
**Người rà soát**: Antigravity
**Module**: M03 - Bảng tin xã hội (UC-20 đến UC-26)

## Kết quả rà soát
Kiểm tra tại `src/features/posts/api/actions.ts`:
- **FR-M03-001 (Xem bảng tin)**: `getFeedPageAction` và `getHomeStatsAction` đã được triển khai, áp dụng RBAC `feed.view`.
- **FR-M03-002 (Quản lý bài viết)**: Đầy đủ các action `createPostAction`, `updatePostAction`, `deletePostAction` hỗ trợ text, media, poll, video. Tích hợp `checkRateLimit` (5 posts/60s).
- **FR-M03-003 (Tương tác)**: `toggleReactionAction` xử lý tốt việc Like/Unlike. Rate limit: 30 reactions/60s.
- **FR-M03-004 (Bình luận)**: `createCommentAction` và `deleteCommentAction` hoạt động với RBAC `posts.comment`. Rate limit: 15 comments/60s.
- **FR-M03-005 (Chia sẻ)**: `sharePostAction` hỗ trợ share.
- **FR-M03-006 (Bình chọn)**: `voteAction` lưu trữ an toàn trong `poll_votes`.
- **FR-M03-007 (Nhắc tên - Mentions)**: `searchMentionableUsersAction` truy vấn trực tiếp với giới hạn (limit=8) cho AutoComplete.

## Bugs / Issues
**Không có lỗi (No bugs found)**.
- Áp dụng Rate Limiting chặt chẽ cho toàn bộ Write Actions là một thiết kế rất xuất sắc (chống spam feed).
- RBAC validation đầy đủ.

## Đề xuất cải tiến
- Đối với `searchMentionableUsersAction`, có thể thêm Debounce ở phía Client (nếu chưa có) để giảm thiểu request API dư thừa khi gõ tên nhanh.
