import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-62",
  "module": "M09",
  "title": "Quan ly trang thai nguoi dung",
  "actor": "Quan tri vien",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/admin/users",
  "codeEntry": "src/features/admin/api/users.ts",
  "flow": [
    "admin route",
    "admin panel",
    "admin API",
    "admin service/repo",
    "audit/revalidation"
  ],
  "cases": [
    {
      "id": "TC-ADMIN-UC62-01",
      "kind": "functional",
      "title": "Quan ly trang thai nguoi dung - luồng chính",
      "preconditions": [
        "Actor Quan tri vien matches the SRS actor for UC-62",
        "Route /admin/users is reachable"
      ],
      "steps": [
        "Mở /admin/users",
        "Thực hiện Quan ly trang thai nguoi dung với dữ liệu: userId, action"
      ],
      "expected": [
        "admin filters users and changes allowed user status",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "userId, action are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-ADMIN-UC62-02",
      "kind": "required_fields",
      "title": "Quan ly trang thai nguoi dung - trường bắt buộc",
      "preconditions": [
        "Actor Quan tri vien can reach /admin/users"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (userId, action)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: userId, action"
      ]
    },
    {
      "id": "TC-ADMIN-UC62-03",
      "kind": "boundary",
      "title": "Quan ly trang thai nguoi dung - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Quan tri vien can reach /admin/users"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (userId, action)"
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
      "id": "TC-ADMIN-UC62-04",
      "kind": "auth",
      "title": "Quan ly trang thai nguoi dung - truy cập và phiên đăng nhập",
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
      "id": "TC-ADMIN-UC62-05",
      "kind": "permission",
      "title": "Quan ly trang thai nguoi dung - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-ADMIN-UC62-06",
      "kind": "alternative",
      "title": "Quan ly trang thai nguoi dung - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Quan tri vien can start Quan ly trang thai nguoi dung"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Quan ly trang thai nguoi dung"
      ],
      "expected": [
        "admin cannot self-ban or modify forbidden admin target"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-ADMIN-UC62-07",
      "kind": "state_transition",
      "title": "Quan ly trang thai nguoi dung - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Quan ly trang thai nguoi dung"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "user status moves active/suspended/banned/restored as allowed",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-ADMIN-UC62-08",
      "kind": "side_effect",
      "title": "Quan ly trang thai nguoi dung - tác động liên quan",
      "preconditions": [
        "The Quan ly trang thai nguoi dung happy path has completed once"
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
      "id": "TC-ADMIN-UC62-09",
      "kind": "integration",
      "title": "Quan ly trang thai nguoi dung - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Quan ly trang thai nguoi dung path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "user moderation writes audit log and revalidates admin users section",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-ADMIN-UC62-10",
      "kind": "ui_feedback",
      "title": "Quan ly trang thai nguoi dung - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Quan ly trang thai nguoi dung"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "users panel shows filters, status badges, and action feedback",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-ADMIN-UC62-11",
      "kind": "regression",
      "title": "Quan ly trang thai nguoi dung - hồi quy sau sửa lỗi",
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
