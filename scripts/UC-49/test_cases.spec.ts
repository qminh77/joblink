import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-49",
  "module": "M06",
  "title": "Tao thong bao ung tuyen",
  "actor": "Tac vu tu dong",
  "priority": "Medium",
  "source": "SRS_Joblink.tex",
  "route": "job application event",
  "codeEntry": "src/features/jobs/services/application-notifications.ts",
  "flow": [
    "jobs route",
    "jobs component/hook",
    "jobs action/query",
    "jobs service/policy",
    "jobs/applications/saved_jobs + notifications"
  ],
  "cases": [
    {
      "id": "TC-JOB-UC49-01",
      "kind": "functional",
      "title": "Tao thong bao ung tuyen - luồng chính",
      "preconditions": [
        "Actor Tac vu tu dong matches the SRS actor for UC-49",
        "Route job application event is reachable"
      ],
      "steps": [
        "Mở job application event",
        "Thực hiện Tao thong bao ung tuyen với dữ liệu: applicationId, companyUserId"
      ],
      "expected": [
        "system creates notification for company when application is submitted or withdrawn",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "applicationId, companyUserId are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-JOB-UC49-02",
      "kind": "required_fields",
      "title": "Tao thong bao ung tuyen - trường bắt buộc",
      "preconditions": [
        "Actor Tac vu tu dong can reach job application event"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (applicationId, companyUserId)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: applicationId, companyUserId"
      ]
    },
    {
      "id": "TC-JOB-UC49-03",
      "kind": "boundary",
      "title": "Tao thong bao ung tuyen - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Tac vu tu dong can reach job application event"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (applicationId, companyUserId)"
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
      "id": "TC-JOB-UC49-04",
      "kind": "auth",
      "title": "Tao thong bao ung tuyen - truy cập và phiên đăng nhập",
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
      "id": "TC-JOB-UC49-05",
      "kind": "permission",
      "title": "Tao thong bao ung tuyen - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-JOB-UC49-06",
      "kind": "alternative",
      "title": "Tao thong bao ung tuyen - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Tac vu tu dong can start Tao thong bao ung tuyen"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Tao thong bao ung tuyen"
      ],
      "expected": [
        "invalid event or missing recipient is ignored/logged safely"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-JOB-UC49-07",
      "kind": "state_transition",
      "title": "Tao thong bao ung tuyen - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Tao thong bao ung tuyen"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "notification state moves from absent to queued/in-app visible",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-JOB-UC49-08",
      "kind": "side_effect",
      "title": "Tao thong bao ung tuyen - tác động liên quan",
      "preconditions": [
        "The Tao thong bao ung tuyen happy path has completed once"
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
      "id": "TC-JOB-UC49-09",
      "kind": "integration",
      "title": "Tao thong bao ung tuyen - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Tao thong bao ung tuyen path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "application service and notification creation share the same application payload",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-JOB-UC49-10",
      "kind": "ui_feedback",
      "title": "Tao thong bao ung tuyen - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Tao thong bao ung tuyen"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "company notification badge/list updates without duplicate entries",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-JOB-UC49-11",
      "kind": "regression",
      "title": "Tao thong bao ung tuyen - hồi quy sau sửa lỗi",
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
