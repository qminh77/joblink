import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-43",
  "module": "M06",
  "title": "Luu hoac bo luu viec lam",
  "actor": "Thanh vien",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/jobs/[id]",
  "codeEntry": "src/features/jobs/api/actions.ts",
  "flow": [
    "jobs route",
    "jobs component/hook",
    "jobs action/query",
    "jobs service/policy",
    "jobs/applications/saved_jobs + notifications"
  ],
  "cases": [
    {
      "id": "TC-JOB-UC43-01",
      "kind": "functional",
      "title": "Luu hoac bo luu viec lam - luồng chính",
      "preconditions": [
        "Actor Thanh vien matches the SRS actor for UC-43",
        "Route /jobs/[id] is reachable"
      ],
      "steps": [
        "Mở /jobs/[id]",
        "Thực hiện Luu hoac bo luu viec lam với dữ liệu: jobId"
      ],
      "expected": [
        "member saves and unsaves a job",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "jobId are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-JOB-UC43-02",
      "kind": "required_fields",
      "title": "Luu hoac bo luu viec lam - trường bắt buộc",
      "preconditions": [
        "Actor Thanh vien can reach /jobs/[id]"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (jobId)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: jobId"
      ]
    },
    {
      "id": "TC-JOB-UC43-03",
      "kind": "boundary",
      "title": "Luu hoac bo luu viec lam - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Thanh vien can reach /jobs/[id]"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (jobId)"
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
      "id": "TC-JOB-UC43-04",
      "kind": "auth",
      "title": "Luu hoac bo luu viec lam - truy cập và phiên đăng nhập",
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
      "id": "TC-JOB-UC43-05",
      "kind": "permission",
      "title": "Luu hoac bo luu viec lam - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-JOB-UC43-06",
      "kind": "alternative",
      "title": "Luu hoac bo luu viec lam - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Thanh vien can start Luu hoac bo luu viec lam"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Luu hoac bo luu viec lam"
      ],
      "expected": [
        "company/admin/non-member or invalid job cannot save"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-JOB-UC43-07",
      "kind": "state_transition",
      "title": "Luu hoac bo luu viec lam - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Luu hoac bo luu viec lam"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "saved state toggles on/off and saved list updates",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-JOB-UC43-08",
      "kind": "side_effect",
      "title": "Luu hoac bo luu viec lam - tác động liên quan",
      "preconditions": [
        "The Luu hoac bo luu viec lam happy path has completed once"
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
      "id": "TC-JOB-UC43-09",
      "kind": "integration",
      "title": "Luu hoac bo luu viec lam - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Luu hoac bo luu viec lam path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "saved_jobs row, saved jobs page, and job card cache stay consistent",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-JOB-UC43-10",
      "kind": "ui_feedback",
      "title": "Luu hoac bo luu viec lam - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Luu hoac bo luu viec lam"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "save button updates instantly and handles repeat clicks",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-JOB-UC43-11",
      "kind": "regression",
      "title": "Luu hoac bo luu viec lam - hồi quy sau sửa lỗi",
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
