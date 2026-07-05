import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-60",
  "module": "M08",
  "title": "Gui bao cao vi pham",
  "actor": "Nguoi dung",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "report dialog",
  "codeEntry": "src/features/reports/api/actions.ts",
  "flow": [
    "settings/report UI",
    "settings/report hook",
    "settings/report action",
    "service/repository",
    "users/preferences/reports"
  ],
  "cases": [
    {
      "id": "TC-SETTINGS-UC60-01",
      "kind": "functional",
      "title": "Gui bao cao vi pham - luồng chính",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-60",
        "Route report dialog is reachable"
      ],
      "steps": [
        "Mở report dialog",
        "Thực hiện Gui bao cao vi pham với dữ liệu: targetType, targetId, reason"
      ],
      "expected": [
        "user reports a valid target with a fixed reason and optional description",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "targetType, targetId, reason are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-SETTINGS-UC60-02",
      "kind": "required_fields",
      "title": "Gui bao cao vi pham - trường bắt buộc",
      "preconditions": [
        "Actor Nguoi dung can reach report dialog"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (targetType, targetId, reason)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: targetType, targetId, reason"
      ]
    },
    {
      "id": "TC-SETTINGS-UC60-03",
      "kind": "boundary",
      "title": "Gui bao cao vi pham - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Nguoi dung can reach report dialog"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (targetType, targetId, reason)"
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
      "id": "TC-SETTINGS-UC60-04",
      "kind": "auth",
      "title": "Gui bao cao vi pham - truy cập và phiên đăng nhập",
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
      "id": "TC-SETTINGS-UC60-05",
      "kind": "permission",
      "title": "Gui bao cao vi pham - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-SETTINGS-UC60-06",
      "kind": "alternative",
      "title": "Gui bao cao vi pham - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Nguoi dung can start Gui bao cao vi pham"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Gui bao cao vi pham"
      ],
      "expected": [
        "missing reason, invalid target type/id, or self-ineligible target is rejected"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-SETTINGS-UC60-07",
      "kind": "state_transition",
      "title": "Gui bao cao vi pham - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Gui bao cao vi pham"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "report state moves to pending moderation",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-SETTINGS-UC60-08",
      "kind": "side_effect",
      "title": "Gui bao cao vi pham - tác động liên quan",
      "preconditions": [
        "The Gui bao cao vi pham happy path has completed once"
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
      "id": "TC-SETTINGS-UC60-09",
      "kind": "integration",
      "title": "Gui bao cao vi pham - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Gui bao cao vi pham path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "reports row is visible to admin UC-66 without exposing reporter details publicly",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-SETTINGS-UC60-10",
      "kind": "ui_feedback",
      "title": "Gui bao cao vi pham - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Gui bao cao vi pham"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "report dialog validates reason and thanks user on success",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-SETTINGS-UC60-11",
      "kind": "regression",
      "title": "Gui bao cao vi pham - hồi quy sau sửa lỗi",
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
