import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-57",
  "module": "M08",
  "title": "Doi mat khau",
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
      "id": "TC-SETTINGS-UC57-01",
      "kind": "functional",
      "title": "Doi mat khau - luồng chính",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-57",
        "Route /settings is reachable"
      ],
      "steps": [
        "Mở /settings",
        "Thực hiện Doi mat khau với dữ liệu: currentPassword, newPassword"
      ],
      "expected": [
        "user changes password with the correct current password",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "currentPassword, newPassword are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-SETTINGS-UC57-02",
      "kind": "required_fields",
      "title": "Doi mat khau - trường bắt buộc",
      "preconditions": [
        "Actor Nguoi dung can reach /settings"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (currentPassword, newPassword)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: currentPassword, newPassword"
      ]
    },
    {
      "id": "TC-SETTINGS-UC57-03",
      "kind": "boundary",
      "title": "Doi mat khau - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Nguoi dung can reach /settings"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (currentPassword, newPassword)"
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
      "id": "TC-SETTINGS-UC57-04",
      "kind": "auth",
      "title": "Doi mat khau - truy cập và phiên đăng nhập",
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
      "id": "TC-SETTINGS-UC57-05",
      "kind": "permission",
      "title": "Doi mat khau - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-SETTINGS-UC57-06",
      "kind": "alternative",
      "title": "Doi mat khau - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Nguoi dung can start Doi mat khau"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Doi mat khau"
      ],
      "expected": [
        "wrong current password or weak new password is rejected"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-SETTINGS-UC57-07",
      "kind": "state_transition",
      "title": "Doi mat khau - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Doi mat khau"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "password credential moves to updated state without changing session unexpectedly",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-SETTINGS-UC57-08",
      "kind": "side_effect",
      "title": "Doi mat khau - tác động liên quan",
      "preconditions": [
        "The Doi mat khau happy path has completed once"
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
      "id": "TC-SETTINGS-UC57-09",
      "kind": "integration",
      "title": "Doi mat khau - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Doi mat khau path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "Supabase Auth update and audit log record the change safely",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-SETTINGS-UC57-10",
      "kind": "ui_feedback",
      "title": "Doi mat khau - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Doi mat khau"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "password form clears sensitive fields after success or error",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-SETTINGS-UC57-11",
      "kind": "regression",
      "title": "Doi mat khau - hồi quy sau sửa lỗi",
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
