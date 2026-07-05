import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-44",
  "module": "M06",
  "title": "Dang tin tuyen dung",
  "actor": "Cong ty",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/company/post-job",
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
      "id": "TC-JOB-UC44-01",
      "kind": "functional",
      "title": "Dang tin tuyen dung - luồng chính",
      "preconditions": [
        "Actor Cong ty matches the SRS actor for UC-44",
        "Route /company/post-job is reachable"
      ],
      "steps": [
        "Mở /company/post-job",
        "Thực hiện Dang tin tuyen dung với dữ liệu: title, description, jobTypeId, workModeId"
      ],
      "expected": [
        "verified company creates a job post with required job fields",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "title, description, jobTypeId, workModeId are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-JOB-UC44-02",
      "kind": "required_fields",
      "title": "Dang tin tuyen dung - trường bắt buộc",
      "preconditions": [
        "Actor Cong ty can reach /company/post-job"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (title, description, jobTypeId, workModeId)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: title, description, jobTypeId, workModeId"
      ]
    },
    {
      "id": "TC-JOB-UC44-03",
      "kind": "boundary",
      "title": "Dang tin tuyen dung - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Cong ty can reach /company/post-job"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (title, description, jobTypeId, workModeId)"
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
      "id": "TC-JOB-UC44-04",
      "kind": "auth",
      "title": "Dang tin tuyen dung - truy cập và phiên đăng nhập",
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
      "id": "TC-JOB-UC44-05",
      "kind": "permission",
      "title": "Dang tin tuyen dung - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-JOB-UC44-06",
      "kind": "alternative",
      "title": "Dang tin tuyen dung - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Cong ty can start Dang tin tuyen dung"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Dang tin tuyen dung"
      ],
      "expected": [
        "unverified company, invalid salary range, or missing required fields is rejected"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-JOB-UC44-07",
      "kind": "state_transition",
      "title": "Dang tin tuyen dung - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Dang tin tuyen dung"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "job draft/form moves to created job state",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-JOB-UC44-08",
      "kind": "side_effect",
      "title": "Dang tin tuyen dung - tác động liên quan",
      "preconditions": [
        "The Dang tin tuyen dung happy path has completed once"
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
      "id": "TC-JOB-UC44-09",
      "kind": "integration",
      "title": "Dang tin tuyen dung - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Dang tin tuyen dung path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "create job service checks company policy and writes audit log",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-JOB-UC44-10",
      "kind": "ui_feedback",
      "title": "Dang tin tuyen dung - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Dang tin tuyen dung"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "post job form shows validation, submit loading, and created redirect",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-JOB-UC44-11",
      "kind": "regression",
      "title": "Dang tin tuyen dung - hồi quy sau sửa lỗi",
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
