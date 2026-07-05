import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-07",
  "module": "M01",
  "title": "Gui yeu cau dat lai mat khau",
  "actor": "Khach, Dich vu Email",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/forgot-password",
  "codeEntry": "src/features/auth/api/auth-actions.ts",
  "flow": [
    "public auth route",
    "auth component/hook",
    "auth action/client",
    "Supabase Auth",
    "public.users mirror"
  ],
  "cases": [
    {
      "id": "TC-AUTH-UC07-01",
      "kind": "functional",
      "title": "Gui yeu cau dat lai mat khau - luồng chính",
      "preconditions": [
        "Actor Khach, Dich vu Email matches the SRS actor for UC-07",
        "Route /forgot-password is reachable"
      ],
      "steps": [
        "Mở /forgot-password",
        "Thực hiện Gui yeu cau dat lai mat khau với dữ liệu: email"
      ],
      "expected": [
        "valid reset request sends a password reset email without leaking account existence",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "email are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-AUTH-UC07-02",
      "kind": "required_fields",
      "title": "Gui yeu cau dat lai mat khau - trường bắt buộc",
      "preconditions": [
        "Actor Khach, Dich vu Email can reach /forgot-password"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (email)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: email"
      ]
    },
    {
      "id": "TC-AUTH-UC07-03",
      "kind": "boundary",
      "title": "Gui yeu cau dat lai mat khau - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Khach, Dich vu Email can reach /forgot-password"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (email)"
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
      "id": "TC-AUTH-UC07-04",
      "kind": "auth",
      "title": "Gui yeu cau dat lai mat khau - truy cập và phiên đăng nhập",
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
      "id": "TC-AUTH-UC07-05",
      "kind": "permission",
      "title": "Gui yeu cau dat lai mat khau - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-AUTH-UC07-06",
      "kind": "alternative",
      "title": "Gui yeu cau dat lai mat khau - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Khach, Dich vu Email can start Gui yeu cau dat lai mat khau"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Gui yeu cau dat lai mat khau"
      ],
      "expected": [
        "unknown or malformed email returns neutral response"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-AUTH-UC07-07",
      "kind": "state_transition",
      "title": "Gui yeu cau dat lai mat khau - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Gui yeu cau dat lai mat khau"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "guest request moves to reset-email-sent or safe-neutral state",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-AUTH-UC07-08",
      "kind": "side_effect",
      "title": "Gui yeu cau dat lai mat khau - tác động liên quan",
      "preconditions": [
        "The Gui yeu cau dat lai mat khau happy path has completed once"
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
      "id": "TC-AUTH-UC07-09",
      "kind": "integration",
      "title": "Gui yeu cau dat lai mat khau - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Gui yeu cau dat lai mat khau path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "SMTP/Supabase reset link generation does not expose private user data",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-AUTH-UC07-10",
      "kind": "ui_feedback",
      "title": "Gui yeu cau dat lai mat khau - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Gui yeu cau dat lai mat khau"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "forgot password form confirms next steps consistently",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-AUTH-UC07-11",
      "kind": "regression",
      "title": "Gui yeu cau dat lai mat khau - hồi quy sau sửa lỗi",
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
