import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-46",
  "module": "M06",
  "title": "Doi trang thai tin tuyen dung",
  "actor": "Cong ty",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/company/post-job/[id]",
  "codeEntry": "src/features/companies/api/actions.ts",
  "flow": [
    "jobs route",
    "jobs component/hook",
    "jobs action/query",
    "jobs service/policy",
    "jobs/applications/saved_jobs + notifications"
  ],
  "cases": [
    {
      "id": "TC-JOB-UC46-01",
      "kind": "functional",
      "title": "Doi trang thai tin tuyen dung - luồng chính",
      "preconditions": [
        "Actor Cong ty matches the SRS actor for UC-46",
        "Route /company/post-job/[id] is reachable"
      ],
      "steps": [
        "Mở /company/post-job/[id]",
        "Thực hiện Doi trang thai tin tuyen dung với dữ liệu: jobId, newStatus"
      ],
      "expected": [
        "company changes job status such as open, closed, draft, or expired where allowed",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "jobId, newStatus are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-JOB-UC46-02",
      "kind": "required_fields",
      "title": "Doi trang thai tin tuyen dung - trường bắt buộc",
      "preconditions": [
        "Actor Cong ty can reach /company/post-job/[id]"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (jobId, newStatus)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: jobId, newStatus"
      ]
    },
    {
      "id": "TC-JOB-UC46-03",
      "kind": "boundary",
      "title": "Doi trang thai tin tuyen dung - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Cong ty can reach /company/post-job/[id]"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (jobId, newStatus)"
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
      "id": "TC-JOB-UC46-04",
      "kind": "auth",
      "title": "Doi trang thai tin tuyen dung - truy cập và phiên đăng nhập",
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
      "id": "TC-JOB-UC46-05",
      "kind": "permission",
      "title": "Doi trang thai tin tuyen dung - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-JOB-UC46-06",
      "kind": "alternative",
      "title": "Doi trang thai tin tuyen dung - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Cong ty can start Doi trang thai tin tuyen dung"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Doi trang thai tin tuyen dung"
      ],
      "expected": [
        "invalid status transition or non-owned job is rejected"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-JOB-UC46-07",
      "kind": "state_transition",
      "title": "Doi trang thai tin tuyen dung - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Doi trang thai tin tuyen dung"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "job status moves to selected allowed state",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-JOB-UC46-08",
      "kind": "side_effect",
      "title": "Doi trang thai tin tuyen dung - tác động liên quan",
      "preconditions": [
        "The Doi trang thai tin tuyen dung happy path has completed once"
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
      "id": "TC-JOB-UC46-09",
      "kind": "integration",
      "title": "Doi trang thai tin tuyen dung - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Doi trang thai tin tuyen dung path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "status update RPC updates jobs and invalidates public/company views",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-JOB-UC46-10",
      "kind": "ui_feedback",
      "title": "Doi trang thai tin tuyen dung - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Doi trang thai tin tuyen dung"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "status control reflects disabled, loading, success, and rejected transitions",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-JOB-UC46-11",
      "kind": "regression",
      "title": "Doi trang thai tin tuyen dung - hồi quy sau sửa lỗi",
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
