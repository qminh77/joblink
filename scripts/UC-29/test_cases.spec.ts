import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-29",
  "module": "M04",
  "title": "Tuong tac cam xuc bai viet",
  "actor": "Nguoi dung",
  "priority": "Medium",
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
      "id": "TC-POST-UC29-01",
      "kind": "functional",
      "title": "Tuong tac cam xuc bai viet - luồng chính",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-29",
        "Route /home is reachable"
      ],
      "steps": [
        "Mở /home",
        "Thực hiện Tuong tac cam xuc bai viet với dữ liệu: postId, reactionType"
      ],
      "expected": [
        "user toggles a reaction on a visible post",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "postId, reactionType are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-POST-UC29-02",
      "kind": "required_fields",
      "title": "Tuong tac cam xuc bai viet - trường bắt buộc",
      "preconditions": [
        "Actor Nguoi dung can reach /home"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (postId, reactionType)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: postId, reactionType"
      ]
    },
    {
      "id": "TC-POST-UC29-03",
      "kind": "boundary",
      "title": "Tuong tac cam xuc bai viet - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Nguoi dung can reach /home"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (postId, reactionType)"
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
      "id": "TC-POST-UC29-04",
      "kind": "auth",
      "title": "Tuong tac cam xuc bai viet - truy cập và phiên đăng nhập",
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
      "id": "TC-POST-UC29-05",
      "kind": "permission",
      "title": "Tuong tac cam xuc bai viet - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-POST-UC29-06",
      "kind": "alternative",
      "title": "Tuong tac cam xuc bai viet - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Nguoi dung can start Tuong tac cam xuc bai viet"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Tuong tac cam xuc bai viet"
      ],
      "expected": [
        "hidden/deleted post or invalid reaction type is rejected"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-POST-UC29-07",
      "kind": "state_transition",
      "title": "Tuong tac cam xuc bai viet - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Tuong tac cam xuc bai viet"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "reaction state toggles on/off and count updates",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-POST-UC29-08",
      "kind": "side_effect",
      "title": "Tuong tac cam xuc bai viet - tác động liên quan",
      "preconditions": [
        "The Tuong tac cam xuc bai viet happy path has completed once"
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
      "id": "TC-POST-UC29-09",
      "kind": "integration",
      "title": "Tuong tac cam xuc bai viet - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Tuong tac cam xuc bai viet path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "post_reactions row and post reaction_count stay synchronized",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-POST-UC29-10",
      "kind": "ui_feedback",
      "title": "Tuong tac cam xuc bai viet - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Tuong tac cam xuc bai viet"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "reaction button updates optimistically and rolls back on error",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-POST-UC29-11",
      "kind": "regression",
      "title": "Tuong tac cam xuc bai viet - hồi quy sau sửa lỗi",
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
