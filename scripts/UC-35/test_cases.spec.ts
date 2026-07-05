import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-35",
  "module": "M05",
  "title": "Xem goi y ket noi",
  "actor": "Nguoi dung",
  "priority": "Medium",
  "source": "SRS_Joblink.tex",
  "route": "/network",
  "codeEntry": "src/features/network/api/actions.ts",
  "flow": [
    "network/search/profile UI",
    "network/search hooks",
    "network/search action",
    "service/repository/RPC",
    "connections/follows/blocks/search data"
  ],
  "cases": [
    {
      "id": "TC-NETWORK-UC35-01",
      "kind": "functional",
      "title": "Xem goi y ket noi - luồng chính",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-35",
        "Route /network is reachable"
      ],
      "steps": [
        "Mở /network",
        "Thực hiện Xem goi y ket noi với dữ liệu: currentUserId"
      ],
      "expected": [
        "user sees connection suggestions and network overview",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "currentUserId are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-NETWORK-UC35-02",
      "kind": "required_fields",
      "title": "Xem goi y ket noi - trường bắt buộc",
      "preconditions": [
        "Actor Nguoi dung can reach /network"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (currentUserId)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: currentUserId"
      ]
    },
    {
      "id": "TC-NETWORK-UC35-03",
      "kind": "boundary",
      "title": "Xem goi y ket noi - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Nguoi dung can reach /network"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (currentUserId)"
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
      "id": "TC-NETWORK-UC35-04",
      "kind": "auth",
      "title": "Xem goi y ket noi - truy cập và phiên đăng nhập",
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
      "id": "TC-NETWORK-UC35-05",
      "kind": "permission",
      "title": "Xem goi y ket noi - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-NETWORK-UC35-06",
      "kind": "alternative",
      "title": "Xem goi y ket noi - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Nguoi dung can start Xem goi y ket noi"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Xem goi y ket noi"
      ],
      "expected": [
        "blocked users or existing connections are excluded from suggestions"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-NETWORK-UC35-07",
      "kind": "state_transition",
      "title": "Xem goi y ket noi - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Xem goi y ket noi"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "suggestion list moves from generated to dismissed/acted-on state",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-NETWORK-UC35-08",
      "kind": "side_effect",
      "title": "Xem goi y ket noi - tác động liên quan",
      "preconditions": [
        "The Xem goi y ket noi happy path has completed once"
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
      "id": "TC-NETWORK-UC35-09",
      "kind": "integration",
      "title": "Xem goi y ket noi - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Xem goi y ket noi path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "suggestion RPC and connection relation state stay aligned",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-NETWORK-UC35-10",
      "kind": "ui_feedback",
      "title": "Xem goi y ket noi - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Xem goi y ket noi"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "network page shows requests, connections, suggestions, and empty states",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-NETWORK-UC35-11",
      "kind": "regression",
      "title": "Xem goi y ket noi - hồi quy sau sửa lỗi",
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
