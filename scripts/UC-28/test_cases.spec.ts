import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-28",
  "module": "M04",
  "title": "Sua hoac xoa bai viet",
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
      "id": "TC-POST-UC28-01",
      "kind": "functional",
      "title": "Sua hoac xoa bai viet - luồng chính",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-28",
        "Route /home is reachable"
      ],
      "steps": [
        "Mở /home",
        "Thực hiện Sua hoac xoa bai viet với dữ liệu: postId"
      ],
      "expected": [
        "post owner edits or deletes their own post",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "postId are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-POST-UC28-02",
      "kind": "required_fields",
      "title": "Sua hoac xoa bai viet - trường bắt buộc",
      "preconditions": [
        "Actor Nguoi dung can reach /home"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (postId)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: postId"
      ]
    },
    {
      "id": "TC-POST-UC28-03",
      "kind": "boundary",
      "title": "Sua hoac xoa bai viet - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Nguoi dung can reach /home"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (postId)"
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
      "id": "TC-POST-UC28-04",
      "kind": "auth",
      "title": "Sua hoac xoa bai viet - truy cập và phiên đăng nhập",
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
      "id": "TC-POST-UC28-05",
      "kind": "permission",
      "title": "Sua hoac xoa bai viet - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-POST-UC28-06",
      "kind": "alternative",
      "title": "Sua hoac xoa bai viet - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Nguoi dung can start Sua hoac xoa bai viet"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Sua hoac xoa bai viet"
      ],
      "expected": [
        "non-owner, moderated, or deleted post cannot be modified"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-POST-UC28-07",
      "kind": "state_transition",
      "title": "Sua hoac xoa bai viet - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Sua hoac xoa bai viet"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "post moves through updated or soft-deleted state",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-POST-UC28-08",
      "kind": "side_effect",
      "title": "Sua hoac xoa bai viet - tác động liên quan",
      "preconditions": [
        "The Sua hoac xoa bai viet happy path has completed once"
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
      "id": "TC-POST-UC28-09",
      "kind": "integration",
      "title": "Sua hoac xoa bai viet - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Sua hoac xoa bai viet path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "post update/delete service updates feed visibility and audit side effects",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-POST-UC28-10",
      "kind": "ui_feedback",
      "title": "Sua hoac xoa bai viet - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Sua hoac xoa bai viet"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "post menu reflects owner-only actions and confirmation states",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-POST-UC28-11",
      "kind": "regression",
      "title": "Sua hoac xoa bai viet - hồi quy sau sửa lỗi",
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
