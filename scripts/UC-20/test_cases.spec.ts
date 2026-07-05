import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-20",
  "module": "M03",
  "title": "Cap nhat ho so cong ty",
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
      "id": "TC-COMPANY-UC20-01",
      "kind": "functional",
      "title": "Cap nhat ho so cong ty - luồng chính",
      "preconditions": [
        "Actor Cong ty matches the SRS actor for UC-20",
        "Route /settings is reachable"
      ],
      "steps": [
        "Mở /settings",
        "Thực hiện Cap nhat ho so cong ty với dữ liệu: companyName, industry, taxId"
      ],
      "expected": [
        "company profile information is updated and appears on settings/public page",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "companyName, industry, taxId are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-COMPANY-UC20-02",
      "kind": "required_fields",
      "title": "Cap nhat ho so cong ty - trường bắt buộc",
      "preconditions": [
        "Actor Cong ty can reach /settings"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (companyName, industry, taxId)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: companyName, industry, taxId"
      ]
    },
    {
      "id": "TC-COMPANY-UC20-03",
      "kind": "boundary",
      "title": "Cap nhat ho so cong ty - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Cong ty can reach /settings"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (companyName, industry, taxId)"
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
      "id": "TC-COMPANY-UC20-04",
      "kind": "auth",
      "title": "Cap nhat ho so cong ty - truy cập và phiên đăng nhập",
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
      "id": "TC-COMPANY-UC20-05",
      "kind": "permission",
      "title": "Cap nhat ho so cong ty - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-COMPANY-UC20-06",
      "kind": "alternative",
      "title": "Cap nhat ho so cong ty - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Cong ty can start Cap nhat ho so cong ty"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Cap nhat ho so cong ty"
      ],
      "expected": [
        "missing company name, invalid tax id, or overlong fields are rejected"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-COMPANY-UC20-07",
      "kind": "state_transition",
      "title": "Cap nhat ho so cong ty - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Cap nhat ho so cong ty"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "company profile moves to saved updated state",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-COMPANY-UC20-08",
      "kind": "side_effect",
      "title": "Cap nhat ho so cong ty - tác động liên quan",
      "preconditions": [
        "The Cap nhat ho so cong ty happy path has completed once"
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
      "id": "TC-COMPANY-UC20-09",
      "kind": "integration",
      "title": "Cap nhat ho so cong ty - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Cap nhat ho so cong ty path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "company_profiles update is scoped to current company account",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-COMPANY-UC20-10",
      "kind": "ui_feedback",
      "title": "Cap nhat ho so cong ty - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Cap nhat ho so cong ty"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "company form shows saved values and validation feedback",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-COMPANY-UC20-11",
      "kind": "regression",
      "title": "Cap nhat ho so cong ty - hồi quy sau sửa lỗi",
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
