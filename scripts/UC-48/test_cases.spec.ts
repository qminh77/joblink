import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-48",
  "module": "M06",
  "title": "Xem hoac rut ho so da ung tuyen",
  "actor": "Thanh vien",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/jobs/applications",
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
      "id": "TC-JOB-UC48-01",
      "kind": "functional",
      "title": "Xem hoac rut ho so da ung tuyen - luồng chính",
      "preconditions": [
        "Actor Thanh vien matches the SRS actor for UC-48",
        "Route /jobs/applications is reachable"
      ],
      "steps": [
        "Mở /jobs/applications",
        "Thực hiện Xem hoac rut ho so da ung tuyen với dữ liệu: applicationId"
      ],
      "expected": [
        "member views applications and withdraws an allowed application",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "applicationId are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-JOB-UC48-02",
      "kind": "required_fields",
      "title": "Xem hoac rut ho so da ung tuyen - trường bắt buộc",
      "preconditions": [
        "Actor Thanh vien can reach /jobs/applications"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (applicationId)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: applicationId"
      ]
    },
    {
      "id": "TC-JOB-UC48-03",
      "kind": "boundary",
      "title": "Xem hoac rut ho so da ung tuyen - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Thanh vien can reach /jobs/applications"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (applicationId)"
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
      "id": "TC-JOB-UC48-04",
      "kind": "auth",
      "title": "Xem hoac rut ho so da ung tuyen - truy cập và phiên đăng nhập",
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
      "id": "TC-JOB-UC48-05",
      "kind": "permission",
      "title": "Xem hoac rut ho so da ung tuyen - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-JOB-UC48-06",
      "kind": "alternative",
      "title": "Xem hoac rut ho so da ung tuyen - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Thanh vien can start Xem hoac rut ho so da ung tuyen"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Xem hoac rut ho so da ung tuyen"
      ],
      "expected": [
        "non-owner application or non-withdrawable state is rejected"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-JOB-UC48-07",
      "kind": "state_transition",
      "title": "Xem hoac rut ho so da ung tuyen - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Xem hoac rut ho so da ung tuyen"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "application state moves submitted -> withdrawn",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-JOB-UC48-08",
      "kind": "side_effect",
      "title": "Xem hoac rut ho so da ung tuyen - tác động liên quan",
      "preconditions": [
        "The Xem hoac rut ho so da ung tuyen happy path has completed once"
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
      "id": "TC-JOB-UC48-09",
      "kind": "integration",
      "title": "Xem hoac rut ho so da ung tuyen - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Xem hoac rut ho so da ung tuyen path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "applications list, job detail application state, and company notification stay consistent",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-JOB-UC48-10",
      "kind": "ui_feedback",
      "title": "Xem hoac rut ho so da ung tuyen - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Xem hoac rut ho so da ung tuyen"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "applications page shows status badges and withdraw confirmation",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-JOB-UC48-11",
      "kind": "regression",
      "title": "Xem hoac rut ho so da ung tuyen - hồi quy sau sửa lỗi",
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
