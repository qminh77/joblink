import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-52",
  "module": "M07",
  "title": "Xem tin nhan va danh dau da doc",
  "actor": "Nguoi dung",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/messages",
  "codeEntry": "src/features/messaging/api/actions.ts",
  "flow": [
    "messages/notifications UI",
    "TanStack Query hook",
    "messaging/notification action",
    "service/repository/RPC",
    "realtime/cache update"
  ],
  "cases": [
    {
      "id": "TC-MSG-UC52-01",
      "kind": "functional",
      "title": "Xem tin nhan va danh dau da doc - luồng chính",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-52",
        "Route /messages is reachable"
      ],
      "steps": [
        "Mở /messages",
        "Thực hiện Xem tin nhan va danh dau da doc với dữ liệu: conversationId"
      ],
      "expected": [
        "user loads messages and marks conversation read",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "conversationId are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-MSG-UC52-02",
      "kind": "required_fields",
      "title": "Xem tin nhan va danh dau da doc - trường bắt buộc",
      "preconditions": [
        "Actor Nguoi dung can reach /messages"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (conversationId)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: conversationId"
      ]
    },
    {
      "id": "TC-MSG-UC52-03",
      "kind": "boundary",
      "title": "Xem tin nhan va danh dau da doc - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Nguoi dung can reach /messages"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (conversationId)"
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
      "id": "TC-MSG-UC52-04",
      "kind": "auth",
      "title": "Xem tin nhan va danh dau da doc - truy cập và phiên đăng nhập",
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
      "id": "TC-MSG-UC52-05",
      "kind": "permission",
      "title": "Xem tin nhan va danh dau da doc - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-MSG-UC52-06",
      "kind": "alternative",
      "title": "Xem tin nhan va danh dau da doc - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Nguoi dung can start Xem tin nhan va danh dau da doc"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Xem tin nhan va danh dau da doc"
      ],
      "expected": [
        "non-participant conversation cannot be read"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-MSG-UC52-07",
      "kind": "state_transition",
      "title": "Xem tin nhan va danh dau da doc - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Xem tin nhan va danh dau da doc"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "unread conversation moves to read state",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-MSG-UC52-08",
      "kind": "side_effect",
      "title": "Xem tin nhan va danh dau da doc - tác động liên quan",
      "preconditions": [
        "The Xem tin nhan va danh dau da doc happy path has completed once"
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
      "id": "TC-MSG-UC52-09",
      "kind": "integration",
      "title": "Xem tin nhan va danh dau da doc - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Xem tin nhan va danh dau da doc path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "participant last_read_at/unread_count and navbar badge update together",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-MSG-UC52-10",
      "kind": "ui_feedback",
      "title": "Xem tin nhan va danh dau da doc - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Xem tin nhan va danh dau da doc"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "chat panel paginates older messages and shows read state",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-MSG-UC52-11",
      "kind": "regression",
      "title": "Xem tin nhan va danh dau da doc - hồi quy sau sửa lỗi",
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
