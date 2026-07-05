import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-53",
  "module": "M07",
  "title": "Xem thong bao",
  "actor": "Nguoi dung",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/notifications",
  "codeEntry": "src/features/notifications/api/queries.ts",
  "flow": [
    "messages/notifications UI",
    "TanStack Query hook",
    "messaging/notification action",
    "service/repository/RPC",
    "realtime/cache update"
  ],
  "cases": [
    {
      "id": "TC-MSG-UC53-01",
      "kind": "functional",
      "title": "Xem thong bao - luồng chính",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-53",
        "Route /notifications is reachable"
      ],
      "steps": [
        "Mở /notifications",
        "Thực hiện Xem thong bao với dữ liệu: cursor"
      ],
      "expected": [
        "user views paged notifications and unread count",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "cursor are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-MSG-UC53-02",
      "kind": "required_fields",
      "title": "Xem thong bao - trường bắt buộc",
      "preconditions": [
        "Actor Nguoi dung can reach /notifications"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (cursor)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: cursor"
      ]
    },
    {
      "id": "TC-MSG-UC53-03",
      "kind": "boundary",
      "title": "Xem thong bao - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Nguoi dung can reach /notifications"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (cursor)"
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
      "id": "TC-MSG-UC53-04",
      "kind": "auth",
      "title": "Xem thong bao - truy cập và phiên đăng nhập",
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
      "id": "TC-MSG-UC53-05",
      "kind": "permission",
      "title": "Xem thong bao - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-MSG-UC53-06",
      "kind": "alternative",
      "title": "Xem thong bao - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Nguoi dung can start Xem thong bao"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Xem thong bao"
      ],
      "expected": [
        "invalid cursor or another user's notification data is rejected/hidden"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-MSG-UC53-07",
      "kind": "state_transition",
      "title": "Xem thong bao - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Xem thong bao"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "notification list moves through initial page and load-more state",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-MSG-UC53-08",
      "kind": "side_effect",
      "title": "Xem thong bao - tác động liên quan",
      "preconditions": [
        "The Xem thong bao happy path has completed once"
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
      "id": "TC-MSG-UC53-09",
      "kind": "integration",
      "title": "Xem thong bao - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Xem thong bao path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "notifications query, unread count, and realtime updates stay aligned",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-MSG-UC53-10",
      "kind": "ui_feedback",
      "title": "Xem thong bao - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Xem thong bao"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "notification list shows skeleton, empty state, unread badge, and target links",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-MSG-UC53-11",
      "kind": "regression",
      "title": "Xem thong bao - hồi quy sau sửa lỗi",
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
