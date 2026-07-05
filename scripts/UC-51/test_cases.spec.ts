import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-51",
  "module": "M07",
  "title": "Gui tin nhan",
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
      "id": "TC-MSG-UC51-01",
      "kind": "functional",
      "title": "Gui tin nhan - luồng chính",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-51",
        "Route /messages is reachable"
      ],
      "steps": [
        "Mở /messages",
        "Thực hiện Gui tin nhan với dữ liệu: conversationId, content"
      ],
      "expected": [
        "user sends a text message in a conversation",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "conversationId, content are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-MSG-UC51-02",
      "kind": "required_fields",
      "title": "Gui tin nhan - trường bắt buộc",
      "preconditions": [
        "Actor Nguoi dung can reach /messages"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (conversationId, content)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: conversationId, content"
      ]
    },
    {
      "id": "TC-MSG-UC51-03",
      "kind": "boundary",
      "title": "Gui tin nhan - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Nguoi dung can reach /messages"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (conversationId, content)"
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
      "id": "TC-MSG-UC51-04",
      "kind": "auth",
      "title": "Gui tin nhan - truy cập và phiên đăng nhập",
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
      "id": "TC-MSG-UC51-05",
      "kind": "permission",
      "title": "Gui tin nhan - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-MSG-UC51-06",
      "kind": "alternative",
      "title": "Gui tin nhan - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Nguoi dung can start Gui tin nhan"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Gui tin nhan"
      ],
      "expected": [
        "empty/overlong message, non-participant, or blocked relation is rejected"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-MSG-UC51-07",
      "kind": "state_transition",
      "title": "Gui tin nhan - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Gui tin nhan"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "message state moves to sent and conversation last message updates",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-MSG-UC51-08",
      "kind": "side_effect",
      "title": "Gui tin nhan - tác động liên quan",
      "preconditions": [
        "The Gui tin nhan happy path has completed once"
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
      "id": "TC-MSG-UC51-09",
      "kind": "integration",
      "title": "Gui tin nhan - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Gui tin nhan path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "messages table, conversation summary, unread counter, and realtime event stay consistent",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-MSG-UC51-10",
      "kind": "ui_feedback",
      "title": "Gui tin nhan - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Gui tin nhan"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "chat input clears on success and preserves message on failure",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-MSG-UC51-11",
      "kind": "regression",
      "title": "Gui tin nhan - hồi quy sau sửa lỗi",
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
