import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-23",
  "module": "M03",
  "title": "Gui lai yeu cau xac minh cong ty",
  "actor": "Cong ty",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/settings",
  "codeEntry": "src/features/companies/api/actions.ts",
  "flow": [
    "company route/settings tab",
    "company component/hook",
    "company action/query",
    "company service/RPC",
    "company_profiles/follows"
  ],
  "cases": [
    {
      "id": "TC-COMPANY-UC23-01",
      "kind": "functional",
      "title": "Gui lai yeu cau xac minh cong ty - luồng chính",
      "preconditions": [
        "Actor Cong ty matches the SRS actor for UC-23",
        "Route /settings is reachable"
      ],
      "steps": [
        "Mở /settings",
        "Thực hiện Gui lai yeu cau xac minh cong ty với dữ liệu: verificationStatus"
      ],
      "expected": [
        "eligible company resubmits verification after rejection or pending update",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "verificationStatus are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-COMPANY-UC23-02",
      "kind": "required_fields",
      "title": "Gui lai yeu cau xac minh cong ty - trường bắt buộc",
      "preconditions": [
        "Actor Cong ty can reach /settings"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (verificationStatus)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: verificationStatus"
      ]
    },
    {
      "id": "TC-COMPANY-UC23-03",
      "kind": "boundary",
      "title": "Gui lai yeu cau xac minh cong ty - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Cong ty can reach /settings"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (verificationStatus)"
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
      "id": "TC-COMPANY-UC23-04",
      "kind": "auth",
      "title": "Gui lai yeu cau xac minh cong ty - truy cập và phiên đăng nhập",
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
      "id": "TC-COMPANY-UC23-05",
      "kind": "permission",
      "title": "Gui lai yeu cau xac minh cong ty - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-COMPANY-UC23-06",
      "kind": "alternative",
      "title": "Gui lai yeu cau xac minh cong ty - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Cong ty can start Gui lai yeu cau xac minh cong ty"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Gui lai yeu cau xac minh cong ty"
      ],
      "expected": [
        "already verified or ineligible company cannot resubmit"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-COMPANY-UC23-07",
      "kind": "state_transition",
      "title": "Gui lai yeu cau xac minh cong ty - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Gui lai yeu cau xac minh cong ty"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "verification status moves back to pending review",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-COMPANY-UC23-08",
      "kind": "side_effect",
      "title": "Gui lai yeu cau xac minh cong ty - tác động liên quan",
      "preconditions": [
        "The Gui lai yeu cau xac minh cong ty happy path has completed once"
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
      "id": "TC-COMPANY-UC23-09",
      "kind": "integration",
      "title": "Gui lai yeu cau xac minh cong ty - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Gui lai yeu cau xac minh cong ty path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "company verification RPC and audit log record the resubmission",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-COMPANY-UC23-10",
      "kind": "ui_feedback",
      "title": "Gui lai yeu cau xac minh cong ty - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Gui lai yeu cau xac minh cong ty"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "verification card shows pending status and next-step copy",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-COMPANY-UC23-11",
      "kind": "regression",
      "title": "Gui lai yeu cau xac minh cong ty - hồi quy sau sửa lỗi",
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
