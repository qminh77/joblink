import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-61",
  "module": "M09",
  "title": "Xem tong quan quan tri",
  "actor": "Quan tri vien",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/admin/dashboard",
  "codeEntry": "src/features/admin/api/dashboard.ts",
  "flow": [
    "admin route",
    "admin panel",
    "admin API",
    "admin service/repo",
    "audit/revalidation"
  ],
  "cases": [
    {
      "id": "TC-ADMIN-UC61-01",
      "kind": "functional",
      "title": "Xem tong quan quan tri - luồng chính",
      "preconditions": [
        "Actor Quan tri vien matches the SRS actor for UC-61",
        "Route /admin/dashboard is reachable"
      ],
      "steps": [
        "Mở /admin/dashboard",
        "Thực hiện Xem tong quan quan tri với dữ liệu: adminSession"
      ],
      "expected": [
        "admin opens dashboard and sees aggregate operational metrics",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "adminSession are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-ADMIN-UC61-02",
      "kind": "required_fields",
      "title": "Xem tong quan quan tri - trường bắt buộc",
      "preconditions": [
        "Actor Quan tri vien can reach /admin/dashboard"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (adminSession)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: adminSession"
      ]
    },
    {
      "id": "TC-ADMIN-UC61-03",
      "kind": "boundary",
      "title": "Xem tong quan quan tri - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Quan tri vien can reach /admin/dashboard"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (adminSession)"
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
      "id": "TC-ADMIN-UC61-04",
      "kind": "auth",
      "title": "Xem tong quan quan tri - truy cập và phiên đăng nhập",
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
      "id": "TC-ADMIN-UC61-05",
      "kind": "permission",
      "title": "Xem tong quan quan tri - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-ADMIN-UC61-06",
      "kind": "alternative",
      "title": "Xem tong quan quan tri - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Quan tri vien can start Xem tong quan quan tri"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Xem tong quan quan tri"
      ],
      "expected": [
        "non-admin cannot access dashboard data"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-ADMIN-UC61-07",
      "kind": "state_transition",
      "title": "Xem tong quan quan tri - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Xem tong quan quan tri"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "dashboard state moves to loaded aggregate snapshot",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-ADMIN-UC61-08",
      "kind": "side_effect",
      "title": "Xem tong quan quan tri - tác động liên quan",
      "preconditions": [
        "The Xem tong quan quan tri happy path has completed once"
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
      "id": "TC-ADMIN-UC61-09",
      "kind": "integration",
      "title": "Xem tong quan quan tri - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Xem tong quan quan tri path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "dashboard service aggregates users, companies, jobs, posts, reports, and recent activity",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-ADMIN-UC61-10",
      "kind": "ui_feedback",
      "title": "Xem tong quan quan tri - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Xem tong quan quan tri"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "admin dashboard shows loading and empty metric states",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-ADMIN-UC61-11",
      "kind": "regression",
      "title": "Xem tong quan quan tri - hồi quy sau sửa lỗi",
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
