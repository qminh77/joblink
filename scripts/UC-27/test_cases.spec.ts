import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-27",
  "module": "M04",
  "title": "Dang bai viet",
  "actor": "Nguoi dung",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/home",
  "codeEntry": "src/features/posts/api/actions.ts",
  "flow": [
    "feed/post route",
    "post component/hook",
    "post action/query",
    "post service/repo/RPC",
    "posts/comments/reactions/shares"
  ],
  "cases": [
    {
      "id": "TC-POST-UC27-01",
      "kind": "functional",
      "title": "Dang bai viet - luồng chính",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-27",
        "Route /home is reachable"
      ],
      "steps": [
        "Mở /home",
        "Thực hiện Dang bai viet với dữ liệu: contentOrMedia, visibility"
      ],
      "expected": [
        "user creates a text/media/article post",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "contentOrMedia, visibility are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-POST-UC27-02",
      "kind": "required_fields",
      "title": "Dang bai viet - trường bắt buộc",
      "preconditions": [
        "Actor Nguoi dung can reach /home"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (contentOrMedia, visibility)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: contentOrMedia, visibility"
      ]
    },
    {
      "id": "TC-POST-UC27-03",
      "kind": "boundary",
      "title": "Dang bai viet - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Nguoi dung can reach /home"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (contentOrMedia, visibility)"
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
      "id": "TC-POST-UC27-04",
      "kind": "auth",
      "title": "Dang bai viet - truy cập và phiên đăng nhập",
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
      "id": "TC-POST-UC27-05",
      "kind": "permission",
      "title": "Dang bai viet - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-POST-UC27-06",
      "kind": "alternative",
      "title": "Dang bai viet - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Nguoi dung can start Dang bai viet"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Dang bai viet"
      ],
      "expected": [
        "empty post, too many media files, or overlong content is rejected"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-POST-UC27-07",
      "kind": "state_transition",
      "title": "Dang bai viet - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Dang bai viet"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "composer draft moves to published feed item",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-POST-UC27-08",
      "kind": "side_effect",
      "title": "Dang bai viet - tác động liên quan",
      "preconditions": [
        "The Dang bai viet happy path has completed once"
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
      "id": "TC-POST-UC27-09",
      "kind": "integration",
      "title": "Dang bai viet - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Dang bai viet path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "post creation, media storage, fanout, and counters stay consistent",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-POST-UC27-10",
      "kind": "ui_feedback",
      "title": "Dang bai viet - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Dang bai viet"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "composer resets on success and preserves draft on validation error",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-POST-UC27-11",
      "kind": "regression",
      "title": "Dang bai viet - hồi quy sau sửa lỗi",
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
