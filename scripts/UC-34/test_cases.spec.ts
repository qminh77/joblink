import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-34",
  "module": "M05",
  "title": "Tim kiem tong hop",
  "actor": "Nguoi dung",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/search",
  "codeEntry": "src/features/search/api/actions.ts",
  "flow": [
    "network/search/profile UI",
    "network/search hooks",
    "network/search action",
    "service/repository/RPC",
    "connections/follows/blocks/search data"
  ],
  "cases": [
    {
      "id": "TC-NETWORK-UC34-01",
      "kind": "functional",
      "title": "Tim kiem tong hop - luồng chính",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-34",
        "Route /search is reachable"
      ],
      "steps": [
        "Mở /search",
        "Thực hiện Tim kiem tong hop với dữ liệu: query"
      ],
      "expected": [
        "user searches across people, companies, posts, and jobs",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "query are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-NETWORK-UC34-02",
      "kind": "required_fields",
      "title": "Tim kiem tong hop - trường bắt buộc",
      "preconditions": [
        "Actor Nguoi dung can reach /search"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (query)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: query"
      ]
    },
    {
      "id": "TC-NETWORK-UC34-03",
      "kind": "boundary",
      "title": "Tim kiem tong hop - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Nguoi dung can reach /search"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (query)"
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
      "id": "TC-NETWORK-UC34-04",
      "kind": "auth",
      "title": "Tim kiem tong hop - truy cập và phiên đăng nhập",
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
      "id": "TC-NETWORK-UC34-05",
      "kind": "permission",
      "title": "Tim kiem tong hop - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-NETWORK-UC34-06",
      "kind": "alternative",
      "title": "Tim kiem tong hop - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Nguoi dung can start Tim kiem tong hop"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Tim kiem tong hop"
      ],
      "expected": [
        "blank query or unsupported filters return validation/empty result"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-NETWORK-UC34-07",
      "kind": "state_transition",
      "title": "Tim kiem tong hop - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Tim kiem tong hop"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "search state moves through all tab and filtered tab results",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-NETWORK-UC34-08",
      "kind": "side_effect",
      "title": "Tim kiem tong hop - tác động liên quan",
      "preconditions": [
        "The Tim kiem tong hop happy path has completed once"
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
      "id": "TC-NETWORK-UC34-09",
      "kind": "integration",
      "title": "Tim kiem tong hop - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Tim kiem tong hop path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "search repos aggregate result counts without leaking private content",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-NETWORK-UC34-10",
      "kind": "ui_feedback",
      "title": "Tim kiem tong hop - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Tim kiem tong hop"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "search page shows loading, tabs, no results, and filter feedback",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-NETWORK-UC34-11",
      "kind": "regression",
      "title": "Tim kiem tong hop - hồi quy sau sửa lỗi",
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
