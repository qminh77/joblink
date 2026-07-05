import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-63",
  "module": "M09",
  "title": "Quan ly xac minh va trang thai cong ty",
  "actor": "Quan tri vien",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/admin/companies",
  "codeEntry": "src/features/admin/api/companies.ts",
  "flow": [
    "admin route",
    "admin panel",
    "admin API",
    "admin service/repo",
    "audit/revalidation"
  ],
  "cases": [
    {
      "id": "TC-ADMIN-UC63-01",
      "kind": "functional",
      "title": "Quan ly xac minh va trang thai cong ty - luồng chính",
      "preconditions": [
        "Actor Quan tri vien matches the SRS actor for UC-63",
        "Route /admin/companies is reachable"
      ],
      "steps": [
        "Mở /admin/companies",
        "Thực hiện Quan ly xac minh va trang thai cong ty với dữ liệu: companyUserId, action"
      ],
      "expected": [
        "admin reviews company verification and updates company status",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "companyUserId, action are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-ADMIN-UC63-02",
      "kind": "required_fields",
      "title": "Quan ly xac minh va trang thai cong ty - trường bắt buộc",
      "preconditions": [
        "Actor Quan tri vien can reach /admin/companies"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (companyUserId, action)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: companyUserId, action"
      ]
    },
    {
      "id": "TC-ADMIN-UC63-03",
      "kind": "boundary",
      "title": "Quan ly xac minh va trang thai cong ty - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Quan tri vien can reach /admin/companies"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (companyUserId, action)"
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
      "id": "TC-ADMIN-UC63-04",
      "kind": "auth",
      "title": "Quan ly xac minh va trang thai cong ty - truy cập và phiên đăng nhập",
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
      "id": "TC-ADMIN-UC63-05",
      "kind": "permission",
      "title": "Quan ly xac minh va trang thai cong ty - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-ADMIN-UC63-06",
      "kind": "alternative",
      "title": "Quan ly xac minh va trang thai cong ty - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Quan tri vien can start Quan ly xac minh va trang thai cong ty"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Quan ly xac minh va trang thai cong ty"
      ],
      "expected": [
        "missing rejection note or invalid company state is rejected"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-ADMIN-UC63-07",
      "kind": "state_transition",
      "title": "Quan ly xac minh va trang thai cong ty - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Quan ly xac minh va trang thai cong ty"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "company verification moves approved/rejected/pending_update/suspended as allowed",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-ADMIN-UC63-08",
      "kind": "side_effect",
      "title": "Quan ly xac minh va trang thai cong ty - tác động liên quan",
      "preconditions": [
        "The Quan ly xac minh va trang thai cong ty happy path has completed once"
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
      "id": "TC-ADMIN-UC63-09",
      "kind": "integration",
      "title": "Quan ly xac minh va trang thai cong ty - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Quan ly xac minh va trang thai cong ty path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "company moderation updates company_profiles and writes audit log",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-ADMIN-UC63-10",
      "kind": "ui_feedback",
      "title": "Quan ly xac minh va trang thai cong ty - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Quan ly xac minh va trang thai cong ty"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "companies panel shows review note, filters, and status feedback",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-ADMIN-UC63-11",
      "kind": "regression",
      "title": "Quan ly xac minh va trang thai cong ty - hồi quy sau sửa lỗi",
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
