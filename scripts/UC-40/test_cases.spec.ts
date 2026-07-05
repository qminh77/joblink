import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-40",
  "module": "M05",
  "title": "Chan hoac bo chan nguoi dung",
  "actor": "Nguoi dung",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/profile/[id]|/settings",
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
      "id": "TC-NETWORK-UC40-01",
      "kind": "functional",
      "title": "Chan hoac bo chan nguoi dung - luồng chính",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-40",
        "Route /profile/[id]|/settings is reachable"
      ],
      "steps": [
        "Mở /profile/[id]|/settings",
        "Thực hiện Chan hoac bo chan nguoi dung với dữ liệu: targetUserId"
      ],
      "expected": [
        "user blocks and unblocks another user",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "targetUserId are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-NETWORK-UC40-02",
      "kind": "required_fields",
      "title": "Chan hoac bo chan nguoi dung - trường bắt buộc",
      "preconditions": [
        "Actor Nguoi dung can reach /profile/[id]|/settings"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (targetUserId)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: targetUserId"
      ]
    },
    {
      "id": "TC-NETWORK-UC40-03",
      "kind": "boundary",
      "title": "Chan hoac bo chan nguoi dung - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Nguoi dung can reach /profile/[id]|/settings"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (targetUserId)"
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
      "id": "TC-NETWORK-UC40-04",
      "kind": "auth",
      "title": "Chan hoac bo chan nguoi dung - truy cập và phiên đăng nhập",
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
      "id": "TC-NETWORK-UC40-05",
      "kind": "permission",
      "title": "Chan hoac bo chan nguoi dung - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-NETWORK-UC40-06",
      "kind": "alternative",
      "title": "Chan hoac bo chan nguoi dung - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Nguoi dung can start Chan hoac bo chan nguoi dung"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Chan hoac bo chan nguoi dung"
      ],
      "expected": [
        "self-block or invalid target is rejected"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-NETWORK-UC40-07",
      "kind": "state_transition",
      "title": "Chan hoac bo chan nguoi dung - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Chan hoac bo chan nguoi dung"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "relationship moves to blocked and later unblocked state",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-NETWORK-UC40-08",
      "kind": "side_effect",
      "title": "Chan hoac bo chan nguoi dung - tác động liên quan",
      "preconditions": [
        "The Chan hoac bo chan nguoi dung happy path has completed once"
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
      "id": "TC-NETWORK-UC40-09",
      "kind": "integration",
      "title": "Chan hoac bo chan nguoi dung - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Chan hoac bo chan nguoi dung path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "block removes/invalidates connection, follow, messaging, and suggestion access",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-NETWORK-UC40-10",
      "kind": "ui_feedback",
      "title": "Chan hoac bo chan nguoi dung - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Chan hoac bo chan nguoi dung"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "profile/settings UI shows blocked state and unblock entry point",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-NETWORK-UC40-11",
      "kind": "regression",
      "title": "Chan hoac bo chan nguoi dung - hồi quy sau sửa lỗi",
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
