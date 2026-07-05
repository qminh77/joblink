import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-58",
  "module": "M08",
  "title": "Cap nhat quyen rieng tu ho so",
  "actor": "Nguoi dung",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/settings",
  "codeEntry": "src/features/settings/api/actions.ts",
  "flow": [
    "settings/report UI",
    "settings/report hook",
    "settings/report action",
    "service/repository",
    "users/preferences/reports"
  ],
  "cases": [
    {
      "id": "TC-SETTINGS-UC58-01",
      "kind": "functional",
      "title": "Cap nhat quyen rieng tu ho so - luồng chính",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-58",
        "Route /settings is reachable"
      ],
      "steps": [
        "Mở /settings",
        "Thực hiện Cap nhat quyen rieng tu ho so với dữ liệu: profileVisibility"
      ],
      "expected": [
        "user updates profile privacy or hiring/open-to-work status",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "profileVisibility are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-SETTINGS-UC58-02",
      "kind": "required_fields",
      "title": "Cap nhat quyen rieng tu ho so - trường bắt buộc",
      "preconditions": [
        "Actor Nguoi dung can reach /settings"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (profileVisibility)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: profileVisibility"
      ]
    },
    {
      "id": "TC-SETTINGS-UC58-03",
      "kind": "boundary",
      "title": "Cap nhat quyen rieng tu ho so - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Nguoi dung can reach /settings"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (profileVisibility)"
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
      "id": "TC-SETTINGS-UC58-04",
      "kind": "auth",
      "title": "Cap nhat quyen rieng tu ho so - truy cập và phiên đăng nhập",
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
      "id": "TC-SETTINGS-UC58-05",
      "kind": "permission",
      "title": "Cap nhat quyen rieng tu ho so - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-SETTINGS-UC58-06",
      "kind": "alternative",
      "title": "Cap nhat quyen rieng tu ho so - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Nguoi dung can start Cap nhat quyen rieng tu ho so"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Cap nhat quyen rieng tu ho so"
      ],
      "expected": [
        "invalid visibility value or wrong role-specific toggle is rejected"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-SETTINGS-UC58-07",
      "kind": "state_transition",
      "title": "Cap nhat quyen rieng tu ho so - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Cap nhat quyen rieng tu ho so"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "privacy/status moves to selected visibility or availability state",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-SETTINGS-UC58-08",
      "kind": "side_effect",
      "title": "Cap nhat quyen rieng tu ho so - tác động liên quan",
      "preconditions": [
        "The Cap nhat quyen rieng tu ho so happy path has completed once"
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
      "id": "TC-SETTINGS-UC58-09",
      "kind": "integration",
      "title": "Cap nhat quyen rieng tu ho so - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Cap nhat quyen rieng tu ho so path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "profile visibility affects UC-14 and company/member availability surfaces",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-SETTINGS-UC58-10",
      "kind": "ui_feedback",
      "title": "Cap nhat quyen rieng tu ho so - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Cap nhat quyen rieng tu ho so"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "privacy card shows current value and saved/error state",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-SETTINGS-UC58-11",
      "kind": "regression",
      "title": "Cap nhat quyen rieng tu ho so - hồi quy sau sửa lỗi",
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
