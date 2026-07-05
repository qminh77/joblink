import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-26",
  "module": "M04",
  "title": "Xem bang tin",
  "actor": "Nguoi dung",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/home",
  "codeEntry": "src/features/posts/api/queries.ts",
  "flow": [
    "feed/post route",
    "post component/hook",
    "post action/query",
    "post service/repo/RPC",
    "posts/comments/reactions/shares"
  ],
  "cases": [
    {
      "id": "TC-POST-UC26-01",
      "kind": "functional",
      "title": "Xem bang tin - luồng chính",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-26",
        "Route /home is reachable"
      ],
      "steps": [
        "Mở /home",
        "Thực hiện Xem bang tin với dữ liệu: cursor"
      ],
      "expected": [
        "user loads paged home feed with visible posts",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "cursor are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-POST-UC26-02",
      "kind": "required_fields",
      "title": "Xem bang tin - trường bắt buộc",
      "preconditions": [
        "Actor Nguoi dung can reach /home"
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
      "id": "TC-POST-UC26-03",
      "kind": "boundary",
      "title": "Xem bang tin - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Nguoi dung can reach /home"
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
      "id": "TC-POST-UC26-04",
      "kind": "auth",
      "title": "Xem bang tin - truy cập và phiên đăng nhập",
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
      "id": "TC-POST-UC26-05",
      "kind": "permission",
      "title": "Xem bang tin - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-POST-UC26-06",
      "kind": "alternative",
      "title": "Xem bang tin - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Nguoi dung can start Xem bang tin"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Xem bang tin"
      ],
      "expected": [
        "blocked/private/deleted posts are excluded"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-POST-UC26-07",
      "kind": "state_transition",
      "title": "Xem bang tin - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Xem bang tin"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "feed cursor moves from first page to next page",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-POST-UC26-08",
      "kind": "side_effect",
      "title": "Xem bang tin - tác động liên quan",
      "preconditions": [
        "The Xem bang tin happy path has completed once"
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
      "id": "TC-POST-UC26-09",
      "kind": "integration",
      "title": "Xem bang tin - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Xem bang tin path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "feed RPC respects visibility, connections, and pagination",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-POST-UC26-10",
      "kind": "ui_feedback",
      "title": "Xem bang tin - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Xem bang tin"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "feed shows skeleton, empty state, and load-more state",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-POST-UC26-11",
      "kind": "regression",
      "title": "Xem bang tin - hồi quy sau sửa lỗi",
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
