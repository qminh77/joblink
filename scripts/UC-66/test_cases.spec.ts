import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-66",
  "module": "M09",
  "title": "Xu ly bao cao vi pham",
  "actor": "Quan tri vien",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/admin/reports",
  "codeEntry": "src/features/admin/api/reports.ts",
  "flow": [
    "admin route",
    "admin panel",
    "admin API",
    "admin service/repo",
    "audit/revalidation"
  ],
  "cases": [
    {
      "id": "TC-ADMIN-UC66-01",
      "kind": "functional",
      "title": "Xu ly bao cao vi pham - luồng chính",
      "preconditions": [
        "Actor Quan tri vien matches the SRS actor for UC-66",
        "Route /admin/reports is reachable"
      ],
      "steps": [
        "Mở /admin/reports",
        "Thực hiện Xu ly bao cao vi pham với dữ liệu: reportId, action"
      ],
      "expected": [
        "admin changes report status or applies a moderation action",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "reportId, action are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-ADMIN-UC66-02",
      "kind": "required_fields",
      "title": "Xu ly bao cao vi pham - trường bắt buộc",
      "preconditions": [
        "Actor Quan tri vien can reach /admin/reports"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (reportId, action)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: reportId, action"
      ]
    },
    {
      "id": "TC-ADMIN-UC66-03",
      "kind": "boundary",
      "title": "Xu ly bao cao vi pham - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Quan tri vien can reach /admin/reports"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (reportId, action)"
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
      "id": "TC-ADMIN-UC66-04",
      "kind": "auth",
      "title": "Xu ly bao cao vi pham - truy cập và phiên đăng nhập",
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
      "id": "TC-ADMIN-UC66-05",
      "kind": "permission",
      "title": "Xu ly bao cao vi pham - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-ADMIN-UC66-06",
      "kind": "alternative",
      "title": "Xu ly bao cao vi pham - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Quan tri vien can start Xu ly bao cao vi pham"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Xu ly bao cao vi pham"
      ],
      "expected": [
        "invalid transition, missing reason, or already resolved report is rejected"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-ADMIN-UC66-07",
      "kind": "state_transition",
      "title": "Xu ly bao cao vi pham - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Xu ly bao cao vi pham"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "report state moves pending/reviewing/resolved/dismissed",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-ADMIN-UC66-08",
      "kind": "side_effect",
      "title": "Xu ly bao cao vi pham - tác động liên quan",
      "preconditions": [
        "The Xu ly bao cao vi pham happy path has completed once"
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
      "id": "TC-ADMIN-UC66-09",
      "kind": "integration",
      "title": "Xu ly bao cao vi pham - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Xu ly bao cao vi pham path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "report, moderation_actions, target entity, and audit log stay consistent",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-ADMIN-UC66-10",
      "kind": "ui_feedback",
      "title": "Xu ly bao cao vi pham - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Xu ly bao cao vi pham"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "reports panel shows action modal, status badge, and result feedback",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-ADMIN-UC66-11",
      "kind": "regression",
      "title": "Xu ly bao cao vi pham - hồi quy sau sửa lỗi",
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
