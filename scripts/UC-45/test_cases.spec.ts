import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-45",
  "module": "M06",
  "title": "Sua tin tuyen dung",
  "actor": "Cong ty",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/company/post-job/[id]",
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
      "id": "TC-JOB-UC45-01",
      "kind": "functional",
      "title": "Sua tin tuyen dung - luồng chính",
      "preconditions": [
        "Actor Cong ty matches the SRS actor for UC-45",
        "Route /company/post-job/[id] is reachable"
      ],
      "steps": [
        "Mở /company/post-job/[id]",
        "Thực hiện Sua tin tuyen dung với dữ liệu: jobId, title"
      ],
      "expected": [
        "company edits a job it owns",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "jobId, title are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-JOB-UC45-02",
      "kind": "required_fields",
      "title": "Sua tin tuyen dung - trường bắt buộc",
      "preconditions": [
        "Actor Cong ty can reach /company/post-job/[id]"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (jobId, title)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: jobId, title"
      ]
    },
    {
      "id": "TC-JOB-UC45-03",
      "kind": "boundary",
      "title": "Sua tin tuyen dung - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Cong ty can reach /company/post-job/[id]"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (jobId, title)"
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
      "id": "TC-JOB-UC45-04",
      "kind": "auth",
      "title": "Sua tin tuyen dung - truy cập và phiên đăng nhập",
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
      "id": "TC-JOB-UC45-05",
      "kind": "permission",
      "title": "Sua tin tuyen dung - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-JOB-UC45-06",
      "kind": "alternative",
      "title": "Sua tin tuyen dung - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Cong ty can start Sua tin tuyen dung"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Sua tin tuyen dung"
      ],
      "expected": [
        "non-owner, unverified company, or invalid salary/status edit is rejected"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-JOB-UC45-07",
      "kind": "state_transition",
      "title": "Sua tin tuyen dung - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Sua tin tuyen dung"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "job moves to updated detail/list state",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-JOB-UC45-08",
      "kind": "side_effect",
      "title": "Sua tin tuyen dung - tác động liên quan",
      "preconditions": [
        "The Sua tin tuyen dung happy path has completed once"
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
      "id": "TC-JOB-UC45-09",
      "kind": "integration",
      "title": "Sua tin tuyen dung - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Sua tin tuyen dung path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "job update service preserves ownership and writes audit log/revalidation",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-JOB-UC45-10",
      "kind": "ui_feedback",
      "title": "Sua tin tuyen dung - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Sua tin tuyen dung"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "edit form loads existing values and shows save feedback",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-JOB-UC45-11",
      "kind": "regression",
      "title": "Sua tin tuyen dung - hồi quy sau sửa lỗi",
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
