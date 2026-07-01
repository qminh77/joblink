# Báo cáo rà soát Module M05 (Việc làm và Tuyển dụng)

**Ngày thực hiện**: 2026-06-23
**Người rà soát**: Antigravity
**Module**: M05 - Việc làm và tuyển dụng (UC-33 đến UC-42)

## Kết quả rà soát
Kiểm tra `src/features/jobs/api/actions.ts`:
- **FR-M05-001 (Đăng tuyển)**: `createJobAction` và `updateJobAction` đã được kiểm tra chặt chẽ bằng `ensureCompanyCanManageJobs` (chỉ công ty đã được Admin duyệt `verified` mới được phép đăng). Rate limit: 5 creates/60s.
- **FR-M05-002 (Ứng tuyển)**: `applyToJobAction` yêu cầu tài khoản `member` và bắt buộc có `resumeCvId`. Rate limit: 5 applications/60s. Rút đơn bằng `withdrawApplicationAction`.
- **FR-M05-003 (Lưu việc làm)**: `toggleSavedJobAction` hoạt động chính xác.
- **FR-M05-004 (Lịch phỏng vấn)**: Ứng viên có thể xác nhận/từ chối lịch qua `respondInterviewAction`.

## Bugs / Issues
**Không có lỗi (No bugs found)**.
- Kiểm duyệt quyền đăng bài (Công ty chưa được duyệt thì không được đăng) là một tính năng cực kỳ quan trọng và đã được làm rất tốt.

## Đề xuất cải tiến
- Khi ứng viên `withdrawApplicationAction`, có thể cần trigger Email notification cho NTD (Nhà tuyển dụng) nếu trạng thái trước đó đang là "Phỏng vấn".
