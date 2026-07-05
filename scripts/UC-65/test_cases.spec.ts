import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-65",
  "module": "M09",
  "title": "Kiem duyet tin tuyen dung",
  "actor": "Quan tri vien",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/admin/jobs",
  "codeEntry": "src/features/admin/api/jobs.ts",
  "flow": [
    "admin route",
    "admin panel",
    "admin API",
    "admin service/repo",
    "audit/revalidation"
  ],
  "cases": [
    {
      "id": "TC-ADMIN-UC65-01",
      "kind": "functional",
      "title": "Kiem duyet tin tuyen dung - luồng chính",
      "preconditions": [
        "Actor Quan tri vien matches the SRS actor for UC-65",
        "Route /admin/jobs is reachable"
      ],
      "steps": [
        "Mở /admin/jobs",
        "Thực hiện Kiem duyet tin tuyen dung với dữ liệu: jobId, action"
      ],
      "expected": [
        "admin moderates a job posting",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "jobId, action are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-ADMIN-UC65-02",
      "kind": "required_fields",
      "title": "Kiem duyet tin tuyen dung - trường bắt buộc",
      "preconditions": [
        "Actor Quan tri vien can reach /admin/jobs"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (jobId, action)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: jobId, action"
      ]
    },
    {
      "id": "TC-ADMIN-UC65-03",
      "kind": "boundary",
      "title": "Kiem duyet tin tuyen dung - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Quan tri vien can reach /admin/jobs"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (jobId, action)"
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
      "id": "TC-ADMIN-UC65-04",
      "kind": "auth",
      "title": "Kiem duyet tin tuyen dung - truy cập và phiên đăng nhập",
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
      "id": "TC-ADMIN-UC65-05",
      "kind": "permission",
      "title": "Kiem duyet tin tuyen dung - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-ADMIN-UC65-06",
      "kind": "alternative",
      "title": "Kiem duyet tin tuyen dung - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Quan tri vien can start Kiem duyet tin tuyen dung"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Kiem duyet tin tuyen dung"
      ],
      "expected": [
        "invalid job id or unsupported moderation action is rejected"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-ADMIN-UC65-07",
      "kind": "state_transition",
      "title": "Kiem duyet tin tuyen dung - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Kiem duyet tin tuyen dung"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "job moderation state moves active/removed/restored as allowed",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-ADMIN-UC65-08",
      "kind": "side_effect",
      "title": "Kiem duyet tin tuyen dung - tác động liên quan",
      "preconditions": [
        "The Kiem duyet tin tuyen dung happy path has completed once"
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
      "id": "TC-ADMIN-UC65-09",
      "kind": "integration",
      "title": "Kiem duyet tin tuyen dung - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Kiem duyet tin tuyen dung path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "job moderation service updates jobs status and audit log",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-ADMIN-UC65-10",
      "kind": "ui_feedback",
      "title": "Kiem duyet tin tuyen dung - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Kiem duyet tin tuyen dung"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "jobs panel shows applications count, filters, and status action feedback",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-ADMIN-UC65-11",
      "kind": "regression",
      "title": "Kiem duyet tin tuyen dung - hồi quy sau sửa lỗi",
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
