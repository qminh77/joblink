import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-37",
  "module": "M05",
  "title": "Phan hoi loi moi ket noi",
  "actor": "Nguoi dung",
  "priority": "High",
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
      "id": "TC-NETWORK-UC37-01",
      "kind": "functional",
      "title": "Phan hoi loi moi ket noi - luồng chính",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-37",
        "Route /network is reachable"
      ],
      "steps": [
        "Mở /network",
        "Thực hiện Phan hoi loi moi ket noi với dữ liệu: requestId, response"
      ],
      "expected": [
        "receiver accepts or rejects a pending connection request",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "requestId, response are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-NETWORK-UC37-02",
      "kind": "required_fields",
      "title": "Phan hoi loi moi ket noi - trường bắt buộc",
      "preconditions": [
        "Actor Nguoi dung can reach /network"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (requestId, response)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: requestId, response"
      ]
    },
    {
      "id": "TC-NETWORK-UC37-03",
      "kind": "boundary",
      "title": "Phan hoi loi moi ket noi - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Nguoi dung can reach /network"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (requestId, response)"
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
      "id": "TC-NETWORK-UC37-04",
      "kind": "auth",
      "title": "Phan hoi loi moi ket noi - truy cập và phiên đăng nhập",
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
      "id": "TC-NETWORK-UC37-05",
      "kind": "permission",
      "title": "Phan hoi loi moi ket noi - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-NETWORK-UC37-06",
      "kind": "alternative",
      "title": "Phan hoi loi moi ket noi - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Nguoi dung can start Phan hoi loi moi ket noi"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Phan hoi loi moi ket noi"
      ],
      "expected": [
        "non-receiver or non-pending request cannot be answered"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-NETWORK-UC37-07",
      "kind": "state_transition",
      "title": "Phan hoi loi moi ket noi - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Phan hoi loi moi ket noi"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "request state moves pending -> connected or rejected",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-NETWORK-UC37-08",
      "kind": "side_effect",
      "title": "Phan hoi loi moi ket noi - tác động liên quan",
      "preconditions": [
        "The Phan hoi loi moi ket noi happy path has completed once"
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
      "id": "TC-NETWORK-UC37-09",
      "kind": "integration",
      "title": "Phan hoi loi moi ket noi - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Phan hoi loi moi ket noi path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "connection counters, feed sync, suggestions, and notifications update consistently",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-NETWORK-UC37-10",
      "kind": "ui_feedback",
      "title": "Phan hoi loi moi ket noi - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Phan hoi loi moi ket noi"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "request card disappears or changes state after response",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-NETWORK-UC37-11",
      "kind": "regression",
      "title": "Phan hoi loi moi ket noi - hồi quy sau sửa lỗi",
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
