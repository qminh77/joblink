import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-54",
  "module": "M07",
  "title": "Danh dau thong bao da doc",
  "actor": "Nguoi dung",
  "priority": "Medium",
  "source": "SRS_Joblink.tex",
  "route": "/notifications",
  "codeEntry": "src/features/notifications/api/actions.ts",
  "flow": [
    "messages/notifications UI",
    "TanStack Query hook",
    "messaging/notification action",
    "service/repository/RPC",
    "realtime/cache update"
  ],
  "cases": [
    {
      "id": "TC-MSG-UC54-01",
      "kind": "functional",
      "title": "Danh dau thong bao da doc - luồng chính",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-54",
        "Route /notifications is reachable"
      ],
      "steps": [
        "Mở /notifications",
        "Thực hiện Danh dau thong bao da doc với dữ liệu: notificationId"
      ],
      "expected": [
        "user marks one or all notifications as read",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "notificationId are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-MSG-UC54-02",
      "kind": "required_fields",
      "title": "Danh dau thong bao da doc - trường bắt buộc",
      "preconditions": [
        "Actor Nguoi dung can reach /notifications"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (notificationId)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: notificationId"
      ]
    },
    {
      "id": "TC-MSG-UC54-03",
      "kind": "boundary",
      "title": "Danh dau thong bao da doc - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Nguoi dung can reach /notifications"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (notificationId)"
      ],
      "expected": [
        "Biên hợp lệ được nhận.",
        "Dữ liệu sai bị từ chối.",
        "Không ghi dữ liệu dở."
      ],
      "dataChecks": [
        "Schema or service validation rejects invalid payload"
      ]
    },
    {
      "id": "TC-MSG-UC54-04",
      "kind": "auth",
      "title": "Danh dau thong bao da doc - truy cập và phiên đăng nhập",
      "preconditions": [
        "Trạng thái đăng nhập được thiết lập"
      ],
      "steps": [
        "Thực hiện UC với trạng thái đăng nhập phù hợp; thử chưa đăng nhập hoặc hết phiên nếu UC yêu cầu bảo vệ."
      ],
      "expected": [
        "Đúng vai trò được truy cập.",
        "Sai phiên bị chặn hoặc yêu cầu đăng nhập lại.",
        "Không lộ dữ liệu riêng tư."
      ],
      "dataChecks": [
        "Session guard is evaluated"
      ]
    },
    {
      "id": "TC-MSG-UC54-05",
      "kind": "permission",
      "title": "Danh dau thong bao da doc - phân quyền và trạng thái nghiệp vụ",
      "preconditions": [
        "Use an account with different role or ownership"
      ],
      "steps": [
        "Dùng tài khoản sai vai trò, không sở hữu dữ liệu hoặc đối tượng ở trạng thái không cho phép."
      ],
      "expected": [
        "Thao tác bị từ chối an toàn.",
        "Dữ liệu không bị thay đổi sai.",
        "Thông báo lỗi rõ ràng."
      ],
      "dataChecks": [
        "Role/ownership/status guard is checked"
      ]
    },
    {
      "id": "TC-MSG-UC54-06",
      "kind": "alternative",
      "title": "Danh dau thong bao da doc - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Nguoi dung can start Danh dau thong bao da doc"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Danh dau thong bao da doc"
      ],
      "expected": [
        "another user's notification id or invalid id is rejected"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-MSG-UC54-07",
      "kind": "state_transition",
      "title": "Danh dau thong bao da doc - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Danh dau thong bao da doc"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "notification state moves unread -> read",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-MSG-UC54-08",
      "kind": "side_effect",
      "title": "Danh dau thong bao da doc - tác động liên quan",
      "preconditions": [
        "The Danh dau thong bao da doc happy path has completed once"
      ],
      "steps": [
        "Hoàn tất luồng chính; kiểm tra thông báo, số đếm, badge hoặc dữ liệu liên quan."
      ],
      "expected": [
        "Dữ liệu liên quan đồng bộ.",
        "Không tạo bản ghi/thông báo trùng.",
        "Sau tải lại vẫn đúng."
      ],
      "dataChecks": [
        "Expected side effects are present only once"
      ]
    },
    {
      "id": "TC-MSG-UC54-09",
      "kind": "integration",
      "title": "Danh dau thong bao da doc - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Danh dau thong bao da doc path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "notifications read_at and unread count cache stay consistent",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-MSG-UC54-10",
      "kind": "ui_feedback",
      "title": "Danh dau thong bao da doc - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Danh dau thong bao da doc"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "read action updates badge/list immediately",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-MSG-UC54-11",
      "kind": "regression",
      "title": "Danh dau thong bao da doc - hồi quy sau sửa lỗi",
      "preconditions": [
        "Đã có lỗi được ghi nhận và sửa chữa"
      ],
      "steps": [
        "Chạy lại luồng chính và lỗi từng ghi trong Defect Log sau khi sửa."
      ],
      "expected": [
        "Lỗi đã đóng không tái diễn.",
        "UC liên quan không phát sinh hồi quy.",
        "Kết quả re-test được ghi nhận."
      ],
      "dataChecks": [
        "Regression test passed"
      ]
    }
  ]
})
