import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-15",
  "module": "M02",
  "title": "Xem thong ke ho so ca nhan",
  "actor": "Thanh vien",
  "priority": "Medium",
  "source": "SRS_Joblink.tex",
  "route": "/profile/edit",
  "codeEntry": "src/features/profile/api/actions.ts",
  "flow": [
    "profile route",
    "profile component/hook",
    "profile or CV action/query",
    "profile service/repo",
    "Supabase tables/storage"
  ],
  "cases": [
    {
      "id": "TC-PROFILE-UC15-01",
      "kind": "functional",
      "title": "Xem thong ke ho so ca nhan - luồng chính",
      "preconditions": [
        "Actor Thanh vien matches the SRS actor for UC-15",
        "Route /profile/edit is reachable"
      ],
      "steps": [
        "Mở /profile/edit",
        "Thực hiện Xem thong ke ho so ca nhan với dữ liệu: targetUserId"
      ],
      "expected": [
        "profile owner can view profile statistics and recent view counters",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "targetUserId are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-PROFILE-UC15-02",
      "kind": "required_fields",
      "title": "Xem thong ke ho so ca nhan - trường bắt buộc",
      "preconditions": [
        "Actor Thanh vien can reach /profile/edit"
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
      "id": "TC-PROFILE-UC15-03",
      "kind": "boundary",
      "title": "Xem thong ke ho so ca nhan - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Thanh vien can reach /profile/edit"
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
      "id": "TC-PROFILE-UC15-04",
      "kind": "auth",
      "title": "Xem thong ke ho so ca nhan - truy cập và phiên đăng nhập",
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
      "id": "TC-PROFILE-UC15-05",
      "kind": "permission",
      "title": "Xem thong ke ho so ca nhan - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-PROFILE-UC15-06",
      "kind": "alternative",
      "title": "Xem thong ke ho so ca nhan - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Thanh vien can start Xem thong ke ho so ca nhan"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Xem thong ke ho so ca nhan"
      ],
      "expected": [
        "non-owner or invalid target cannot fetch private stats"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-PROFILE-UC15-07",
      "kind": "state_transition",
      "title": "Xem thong ke ho so ca nhan - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Xem thong ke ho so ca nhan"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "view log aggregation moves to updated stats after profile views",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-PROFILE-UC15-08",
      "kind": "side_effect",
      "title": "Xem thong ke ho so ca nhan - tác động liên quan",
      "preconditions": [
        "The Xem thong ke ho so ca nhan happy path has completed once"
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
      "id": "TC-PROFILE-UC15-09",
      "kind": "integration",
      "title": "Xem thong ke ho so ca nhan - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Xem thong ke ho so ca nhan path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "profile_view_logs and profile counters stay consistent",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-PROFILE-UC15-10",
      "kind": "ui_feedback",
      "title": "Xem thong ke ho so ca nhan - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Xem thong ke ho so ca nhan"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "stats card shows loading, empty, and populated states",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-PROFILE-UC15-11",
      "kind": "regression",
      "title": "Xem thong ke ho so ca nhan - hồi quy sau sửa lỗi",
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
