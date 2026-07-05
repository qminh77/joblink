import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-42",
  "module": "M06",
  "title": "Xem chi tiet viec lam",
  "actor": "Nguoi dung",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/jobs/[id]",
  "codeEntry": "src/features/jobs/api/queries.ts",
  "flow": [
    "jobs route",
    "jobs component/hook",
    "jobs action/query",
    "jobs service/policy",
    "jobs/applications/saved_jobs + notifications"
  ],
  "cases": [
    {
      "id": "TC-JOB-UC42-01",
      "kind": "functional",
      "title": "Xem chi tiet viec lam - luồng chính",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-42",
        "Route /jobs/[id] is reachable"
      ],
      "steps": [
        "Mở /jobs/[id]",
        "Thực hiện Xem chi tiet viec lam với dữ liệu: jobId"
      ],
      "expected": [
        "user opens job detail with company and application/save state",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "jobId are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-JOB-UC42-02",
      "kind": "required_fields",
      "title": "Xem chi tiet viec lam - trường bắt buộc",
      "preconditions": [
        "Actor Nguoi dung can reach /jobs/[id]"
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
      "id": "TC-JOB-UC42-03",
      "kind": "boundary",
      "title": "Xem chi tiet viec lam - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Nguoi dung can reach /jobs/[id]"
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
      "id": "TC-JOB-UC42-04",
      "kind": "auth",
      "title": "Xem chi tiet viec lam - truy cập và phiên đăng nhập",
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
      "id": "TC-JOB-UC42-05",
      "kind": "permission",
      "title": "Xem chi tiet viec lam - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-JOB-UC42-06",
      "kind": "alternative",
      "title": "Xem chi tiet viec lam - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Nguoi dung can start Xem chi tiet viec lam"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Xem chi tiet viec lam"
      ],
      "expected": [
        "missing, removed, or inaccessible job is not shown as active"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-JOB-UC42-07",
      "kind": "state_transition",
      "title": "Xem chi tiet viec lam - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Xem chi tiet viec lam"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "job detail moves to loaded or not-found/closed state",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-JOB-UC42-08",
      "kind": "side_effect",
      "title": "Xem chi tiet viec lam - tác động liên quan",
      "preconditions": [
        "The Xem chi tiet viec lam happy path has completed once"
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
      "id": "TC-JOB-UC42-09",
      "kind": "integration",
      "title": "Xem chi tiet viec lam - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Xem chi tiet viec lam path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "job detail query joins company, saved state, application state, and view log",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-JOB-UC42-10",
      "kind": "ui_feedback",
      "title": "Xem chi tiet viec lam - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Xem chi tiet viec lam"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "detail page shows apply/save availability and company sidebar",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-JOB-UC42-11",
      "kind": "regression",
      "title": "Xem chi tiet viec lam - hồi quy sau sửa lỗi",
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
