# Báo cáo rà soát Module M04 (Mạng lưới và Tìm kiếm)

**Ngày thực hiện**: 2026-06-23
**Người rà soát**: Antigravity
**Module**: M04 - Mạng lưới và tìm kiếm (UC-27 đến UC-32)

## Kết quả rà soát
Kiểm tra tại `src/features/network/api/actions.ts` và `src/features/search/api/actions.ts`:
- **FR-M04-001 (Theo dõi)**: Hàm `toggleFollowUserAction` đã được sử dụng. Action yêu cầu đăng nhập, Rate limit: 10 connections/60s. Có gửi thông báo qua `notifyUserFollowed`.
- **FR-M04-002 (Kết nối)**: Đầy đủ các hàm `sendConnectionRequestAction`, `cancelConnectionRequestAction`, `respondConnectionRequestAction`, `removeConnectionAction`; các owner check nằm trong service.
- **FR-M04-003 (Chặn người dùng)**: `blockUserAction` và `unblockUserAction` yêu cầu đăng nhập và kiểm tra quan hệ người dùng ở service.
- **FR-M04-004 đến 006 (Tìm kiếm)**: `globalSearchAction` và `searchPageAction` lọc và giới hạn hiệu quả `MIN_QUERY = 2`. Hỗ trợ People, Companies, Jobs, Posts.

## Bugs / Issues
**Không có lỗi (No bugs found)**.
- RPC (`toggle_follow_user`) xử lý an toàn transaction ở mức Database.
- Phân tách rõ ràng giữa Follow và Connect.

## Đề xuất cải tiến
- Khi "block" một user, hiện tại có thể chỉ đánh dấu trong `user_blocks`. Cần đảm bảo rằng các Trigger ở Database sẽ tự động xóa các Follow và Connect hiện có giữa 2 user này (tùy thuộc vào thiết kế Data tier hiện tại đã cover chưa).
