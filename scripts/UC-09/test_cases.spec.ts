import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-09",
  "module": "M02",
  "title": "Cap nhat ho so ca nhan",
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
      "id": "TC-PROFILE-UC09-01",
      "kind": "functional",
      "title": "Cap nhat ho so ca nhan - luồng chính",
      "preconditions": [
        "Actor Thanh vien matches the SRS actor for UC-09",
        "Route /profile/edit is reachable"
      ],
      "steps": [
        "Mở /profile/edit",
        "Thực hiện Cap nhat ho so ca nhan với dữ liệu: fullName, headline, about, visibility"
      ],
      "expected": [
        "member profile fields update and render on public profile/edit overview",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "fullName, headline, about, visibility are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-PROFILE-UC09-02",
      "kind": "required_fields",
      "title": "Cap nhat ho so ca nhan - trường bắt buộc",
      "preconditions": [
        "Actor Thanh vien can reach /profile/edit"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (fullName, headline, about, visibility)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: fullName, headline, about, visibility"
      ]
    },
    {
      "id": "TC-PROFILE-UC09-03",
      "kind": "boundary",
      "title": "Cap nhat ho so ca nhan - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Thanh vien can reach /profile/edit"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (fullName, headline, about, visibility)"
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
      "id": "TC-PROFILE-UC09-04",
      "kind": "auth",
      "title": "Cap nhat ho so ca nhan - truy cập và phiên đăng nhập",
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
      "id": "TC-PROFILE-UC09-05",
      "kind": "permission",
      "title": "Cap nhat ho so ca nhan - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-PROFILE-UC09-06",
      "kind": "alternative",
      "title": "Cap nhat ho so ca nhan - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Thanh vien can start Cap nhat ho so ca nhan"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Cap nhat ho so ca nhan"
      ],
      "expected": [
        "invalid visibility or overlong about/headline is rejected"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-PROFILE-UC09-07",
      "kind": "state_transition",
      "title": "Cap nhat ho so ca nhan - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Cap nhat ho so ca nhan"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "profile draft moves to saved member profile state",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-PROFILE-UC09-08",
      "kind": "side_effect",
      "title": "Cap nhat ho so ca nhan - tác động liên quan",
      "preconditions": [
        "The Cap nhat ho so ca nhan happy path has completed once"
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
      "id": "TC-PROFILE-UC09-09",
      "kind": "integration",
      "title": "Cap nhat ho so ca nhan - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Cap nhat ho so ca nhan path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "profile repo updates member_profiles without changing unrelated account data",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-PROFILE-UC09-10",
      "kind": "ui_feedback",
      "title": "Cap nhat ho so ca nhan - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Cap nhat ho so ca nhan"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "edit form reflects saved values and field-level errors",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-PROFILE-UC09-11",
      "kind": "regression",
      "title": "Cap nhat ho so ca nhan - hồi quy sau sửa lỗi",
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
