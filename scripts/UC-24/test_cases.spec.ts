import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-24",
  "module": "M03",
  "title": "Xem trang cong ty",
  "actor": "Nguoi dung",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/company/[id]",
  "codeEntry": "src/features/companies/api/queries.ts",
  "flow": [
    "company route/settings tab",
    "company component/hook",
    "company action/query",
    "company service/RPC",
    "company_profiles/follows"
  ],
  "cases": [
    {
      "id": "TC-COMPANY-UC24-01",
      "kind": "functional",
      "title": "Xem trang cong ty - luồng chính",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-24",
        "Route /company/[id] is reachable"
      ],
      "steps": [
        "Mở /company/[id]",
        "Thực hiện Xem trang cong ty với dữ liệu: companyUserId"
      ],
      "expected": [
        "user opens a company page with company profile, posts, and active jobs",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "companyUserId are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-COMPANY-UC24-02",
      "kind": "required_fields",
      "title": "Xem trang cong ty - trường bắt buộc",
      "preconditions": [
        "Actor Nguoi dung can reach /company/[id]"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (companyUserId)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: companyUserId"
      ]
    },
    {
      "id": "TC-COMPANY-UC24-03",
      "kind": "boundary",
      "title": "Xem trang cong ty - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Nguoi dung can reach /company/[id]"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (companyUserId)"
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
      "id": "TC-COMPANY-UC24-04",
      "kind": "auth",
      "title": "Xem trang cong ty - truy cập và phiên đăng nhập",
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
      "id": "TC-COMPANY-UC24-05",
      "kind": "permission",
      "title": "Xem trang cong ty - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-COMPANY-UC24-06",
      "kind": "alternative",
      "title": "Xem trang cong ty - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Nguoi dung can start Xem trang cong ty"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Xem trang cong ty"
      ],
      "expected": [
        "missing, suspended, or hidden company returns safe empty/not-found state"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-COMPANY-UC24-07",
      "kind": "state_transition",
      "title": "Xem trang cong ty - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Xem trang cong ty"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "company page moves to loaded public overview state",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-COMPANY-UC24-08",
      "kind": "side_effect",
      "title": "Xem trang cong ty - tác động liên quan",
      "preconditions": [
        "The Xem trang cong ty happy path has completed once"
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
      "id": "TC-COMPANY-UC24-09",
      "kind": "integration",
      "title": "Xem trang cong ty - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Xem trang cong ty path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "company overview RPC joins profile, posts, follower state, and jobs consistently",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-COMPANY-UC24-10",
      "kind": "ui_feedback",
      "title": "Xem trang cong ty - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Xem trang cong ty"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "company page handles loading, empty jobs, and follow state",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-COMPANY-UC24-11",
      "kind": "regression",
      "title": "Xem trang cong ty - hồi quy sau sửa lỗi",
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
