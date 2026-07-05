import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-13",
  "module": "M02",
  "title": "Quan ly ky nang nghe nghiep",
  "actor": "Thanh vien",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/profile/edit",
  "codeEntry": "src/features/profile/api/actions.ts",
  "flow": [
    "profile route",
    "profile component/hook",
    "profile or CV action/query",
    "profile service/repo",
    "Supabase tables/storage"
  ],
  "cases": [
    {
      "id": "TC-PROFILE-UC13-01",
      "kind": "functional",
      "title": "Quan ly ky nang nghe nghiep - luồng chính",
      "preconditions": [
        "Actor Thanh vien matches the SRS actor for UC-13",
        "Route /profile/edit is reachable"
      ],
      "steps": [
        "Mở /profile/edit",
        "Thực hiện Quan ly ky nang nghe nghiep với dữ liệu: skillName"
      ],
      "expected": [
        "member can add and remove professional skills",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "skillName are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-PROFILE-UC13-02",
      "kind": "required_fields",
      "title": "Quan ly ky nang nghe nghiep - trường bắt buộc",
      "preconditions": [
        "Actor Thanh vien can reach /profile/edit"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (skillName)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: skillName"
      ]
    },
    {
      "id": "TC-PROFILE-UC13-03",
      "kind": "boundary",
      "title": "Quan ly ky nang nghe nghiep - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Thanh vien can reach /profile/edit"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (skillName)"
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
      "id": "TC-PROFILE-UC13-04",
      "kind": "auth",
      "title": "Quan ly ky nang nghe nghiep - truy cập và phiên đăng nhập",
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
      "id": "TC-PROFILE-UC13-05",
      "kind": "permission",
      "title": "Quan ly ky nang nghe nghiep - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-PROFILE-UC13-06",
      "kind": "alternative",
      "title": "Quan ly ky nang nghe nghiep - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Thanh vien can start Quan ly ky nang nghe nghiep"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Quan ly ky nang nghe nghiep"
      ],
      "expected": [
        "empty, duplicate, or too-long skill names are rejected or normalized"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-PROFILE-UC13-07",
      "kind": "state_transition",
      "title": "Quan ly ky nang nghe nghiep - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Quan ly ky nang nghe nghiep"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "skill list moves through added and removed states",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-PROFILE-UC13-08",
      "kind": "side_effect",
      "title": "Quan ly ky nang nghe nghiep - tác động liên quan",
      "preconditions": [
        "The Quan ly ky nang nghe nghiep happy path has completed once"
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
      "id": "TC-PROFILE-UC13-09",
      "kind": "integration",
      "title": "Quan ly ky nang nghe nghiep - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Quan ly ky nang nghe nghiep path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "member_skills normalization avoids duplicate semantic entries",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-PROFILE-UC13-10",
      "kind": "ui_feedback",
      "title": "Quan ly ky nang nghe nghiep - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Quan ly ky nang nghe nghiep"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "skills section keeps quick-add feedback and duplicate messaging clear",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-PROFILE-UC13-11",
      "kind": "regression",
      "title": "Quan ly ky nang nghe nghiep - hồi quy sau sửa lỗi",
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
