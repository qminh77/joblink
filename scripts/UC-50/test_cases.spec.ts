import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-50",
  "module": "M07",
  "title": "Mo hoac tao hoi thoai truc tiep",
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
      "id": "TC-MSG-UC50-01",
      "kind": "functional",
      "title": "Mo hoac tao hoi thoai truc tiep - luồng chính",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-50",
        "Route /messages is reachable"
      ],
      "steps": [
        "Mở /messages",
        "Thực hiện Mo hoac tao hoi thoai truc tiep với dữ liệu: targetUserId"
      ],
      "expected": [
        "user opens existing or creates direct conversation with another allowed user",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "targetUserId are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-MSG-UC50-02",
      "kind": "required_fields",
      "title": "Mo hoac tao hoi thoai truc tiep - trường bắt buộc",
      "preconditions": [
        "Actor Nguoi dung can reach /messages"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (targetUserId)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: targetUserId"
      ]
    },
    {
      "id": "TC-MSG-UC50-03",
      "kind": "boundary",
      "title": "Mo hoac tao hoi thoai truc tiep - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Nguoi dung can reach /messages"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (targetUserId)"
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
      "id": "TC-MSG-UC50-04",
      "kind": "auth",
      "title": "Mo hoac tao hoi thoai truc tiep - truy cập và phiên đăng nhập",
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
      "id": "TC-MSG-UC50-05",
      "kind": "permission",
      "title": "Mo hoac tao hoi thoai truc tiep - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-MSG-UC50-06",
      "kind": "alternative",
      "title": "Mo hoac tao hoi thoai truc tiep - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Nguoi dung can start Mo hoac tao hoi thoai truc tiep"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Mo hoac tao hoi thoai truc tiep"
      ],
      "expected": [
        "blocked relation, self target, or invalid target is rejected"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-MSG-UC50-07",
      "kind": "state_transition",
      "title": "Mo hoac tao hoi thoai truc tiep - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Mo hoac tao hoi thoai truc tiep"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "conversation state moves absent -> existing/direct conversation",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-MSG-UC50-08",
      "kind": "side_effect",
      "title": "Mo hoac tao hoi thoai truc tiep - tác động liên quan",
      "preconditions": [
        "The Mo hoac tao hoi thoai truc tiep happy path has completed once"
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
      "id": "TC-MSG-UC50-09",
      "kind": "integration",
      "title": "Mo hoac tao hoi thoai truc tiep - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Mo hoac tao hoi thoai truc tiep path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "conversation participants are created once and unread counters stay initialized",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-MSG-UC50-10",
      "kind": "ui_feedback",
      "title": "Mo hoac tao hoi thoai truc tiep - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Mo hoac tao hoi thoai truc tiep"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "message button opens dock/page quickly with existing thread",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-MSG-UC50-11",
      "kind": "regression",
      "title": "Mo hoac tao hoi thoai truc tiep - hồi quy sau sửa lỗi",
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
