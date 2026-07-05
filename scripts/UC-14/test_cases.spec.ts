import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-14",
  "module": "M02",
  "title": "Xem ho so nguoi dung",
  "actor": "Nguoi dung",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/profile/[id]",
  "codeEntry": "src/features/profile/api/queries.ts",
  "flow": [
    "profile route",
    "profile component/hook",
    "profile or CV action/query",
    "profile service/repo",
    "Supabase tables/storage"
  ],
  "cases": [
    {
      "id": "TC-PROFILE-UC14-01",
      "kind": "functional",
      "title": "Xem ho so nguoi dung - luồng chính",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-14",
        "Route /profile/[id] is reachable"
      ],
      "steps": [
        "Mở /profile/[id]",
        "Thực hiện Xem ho so nguoi dung với dữ liệu: profileUserId"
      ],
      "expected": [
        "viewer can see a profile allowed by visibility rules",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "profileUserId are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-PROFILE-UC14-02",
      "kind": "required_fields",
      "title": "Xem ho so nguoi dung - trường bắt buộc",
      "preconditions": [
        "Actor Nguoi dung can reach /profile/[id]"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (profileUserId)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: profileUserId"
      ]
    },
    {
      "id": "TC-PROFILE-UC14-03",
      "kind": "boundary",
      "title": "Xem ho so nguoi dung - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Nguoi dung can reach /profile/[id]"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (profileUserId)"
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
      "id": "TC-PROFILE-UC14-04",
      "kind": "auth",
      "title": "Xem ho so nguoi dung - truy cập và phiên đăng nhập",
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
      "id": "TC-PROFILE-UC14-05",
      "kind": "permission",
      "title": "Xem ho so nguoi dung - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-PROFILE-UC14-06",
      "kind": "alternative",
      "title": "Xem ho so nguoi dung - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Nguoi dung can start Xem ho so nguoi dung"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Xem ho so nguoi dung"
      ],
      "expected": [
        "private or blocked profile hides protected details"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-PROFILE-UC14-07",
      "kind": "state_transition",
      "title": "Xem ho so nguoi dung - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Xem ho so nguoi dung"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "profile view moves to visible, limited, or denied state",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-PROFILE-UC14-08",
      "kind": "side_effect",
      "title": "Xem ho so nguoi dung - tác động liên quan",
      "preconditions": [
        "The Xem ho so nguoi dung happy path has completed once"
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
      "id": "TC-PROFILE-UC14-09",
      "kind": "integration",
      "title": "Xem ho so nguoi dung - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Xem ho so nguoi dung path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "profile visibility, connection relation, and block checks are applied together",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-PROFILE-UC14-10",
      "kind": "ui_feedback",
      "title": "Xem ho so nguoi dung - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Xem ho so nguoi dung"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "profile page shows public, private, and not-found states clearly",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-PROFILE-UC14-11",
      "kind": "regression",
      "title": "Xem ho so nguoi dung - hồi quy sau sửa lỗi",
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
