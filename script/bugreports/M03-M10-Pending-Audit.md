# Kế hoạch rà soát các Module còn lại (M03 - M10)

**Trạng thái**: Đang chờ (Pending)

Dự án Joblink có quy mô lớn, việc rà soát đã hoàn thành ở các Module nền tảng:
- [x] M01: Tài khoản và đăng nhập
- [x] M02: Hồ sơ, doanh nghiệp và CV

Các module tiếp theo cần được đội ngũ QA/Testing tiếp tục theo chuẩn đã thiết lập trong `script/testcases/` và `script/bugreports/`:

## M03: Bảng tin xã hội
- **Kiểm tra**: Các API actions trong `src/features/posts/api`.
- **UC cần cover**: UC-20 đến UC-26 (Tạo bài viết, tương tác, bình luận, share, poll).
- **Security Check**: Quyền xem bài viết (Privacy level).

## M04: Mạng lưới và tìm kiếm
- **Kiểm tra**: `src/features/network` và `src/features/search`.
- **UC cần cover**: Kết nối, theo dõi, chặn người dùng (UC-27 đến UC-32).

## M05: Việc làm và tuyển dụng
- **Kiểm tra**: `src/features/jobs` và module apply.
- **UC cần cover**: Lưu việc làm, cảnh báo việc làm, ứng tuyển, quản lý ứng viên, xếp lịch phỏng vấn (UC-33 đến UC-42).

## M06 - M10: Các hệ thống hỗ trợ và quản trị
- Nhắn tin (M06)
- Cài đặt cá nhân (M07)
- Báo cáo và khiếu nại (M08)
- Quản trị hệ thống (M09)
- Vận hành tự động (M10)

*(Tiếp tục tạo file Audit Report cho từng module khi tiến hành rà soát mã nguồn).*
