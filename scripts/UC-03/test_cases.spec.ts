import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-03",
  "module": "M01",
  "title": "Xac minh email dang ky",
  "actor": "Khach, Dich vu Email",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/auth/callback",
  "codeEntry": "src/app/auth/callback/route.ts",
  "flow": [
    "public auth route",
    "auth component/hook",
    "auth action/client",
    "Supabase Auth",
    "public.users mirror"
  ],
  "cases": [
    {
      "id": "TC-AUTH-UC03-01",
      "kind": "functional",
      "title": "Xac minh email dang ky - luồng chính",
      "preconditions": [
        "Actor Khach, Dich vu Email matches the SRS actor for UC-03",
        "Route /auth/callback is reachable"
      ],
      "steps": [
        "Mở /auth/callback",
        "Thực hiện Xac minh email dang ky với dữ liệu: code"
      ],
      "expected": [
        "valid email verification callback exchanges code and activates email session/state",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "code are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-AUTH-UC03-02",
      "kind": "required_fields",
      "title": "Xac minh email dang ky - trường bắt buộc",
      "preconditions": [
        "Actor Khach, Dich vu Email can reach /auth/callback"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (code)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: code"
      ]
    },
    {
      "id": "TC-AUTH-UC03-03",
      "kind": "boundary",
      "title": "Xac minh email dang ky - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Khach, Dich vu Email can reach /auth/callback"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (code)"
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
      "id": "TC-AUTH-UC03-04",
      "kind": "auth",
      "title": "Xac minh email dang ky - truy cập và phiên đăng nhập",
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
      "id": "TC-AUTH-UC03-05",
      "kind": "permission",
      "title": "Xac minh email dang ky - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-AUTH-UC03-06",
      "kind": "alternative",
      "title": "Xac minh email dang ky - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Khach, Dich vu Email can start Xac minh email dang ky"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Xac minh email dang ky"
      ],
      "expected": [
        "expired, reused, or malformed code redirects to a safe login error"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-AUTH-UC03-07",
      "kind": "state_transition",
      "title": "Xac minh email dang ky - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Xac minh email dang ky"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "unverified account moves to verified email state",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-AUTH-UC03-08",
      "kind": "side_effect",
      "title": "Xac minh email dang ky - tác động liên quan",
      "preconditions": [
        "The Xac minh email dang ky happy path has completed once"
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
      "id": "TC-AUTH-UC03-09",
      "kind": "integration",
      "title": "Xac minh email dang ky - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Xac minh email dang ky path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "Supabase callback and app redirect target stay aligned",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-AUTH-UC03-10",
      "kind": "ui_feedback",
      "title": "Xac minh email dang ky - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Xac minh email dang ky"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "callback page/redirect gives clear success or failure feedback",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-AUTH-UC03-11",
      "kind": "regression",
      "title": "Xac minh email dang ky - hồi quy sau sửa lỗi",
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
