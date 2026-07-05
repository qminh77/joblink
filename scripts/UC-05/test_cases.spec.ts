import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-05",
  "module": "M01",
  "title": "Dang nhap bang Google",
  "actor": "Khach, Google OAuth",
  "priority": "Medium",
  "source": "SRS_Joblink.tex",
  "route": "/login",
  "codeEntry": "src/features/auth/components/google-sign-in-button.tsx",
  "flow": [
    "public auth route",
    "auth component/hook",
    "auth action/client",
    "Supabase Auth",
    "public.users mirror"
  ],
  "cases": [
    {
      "id": "TC-AUTH-UC05-01",
      "kind": "functional",
      "title": "Dang nhap bang Google - luồng chính",
      "preconditions": [
        "Actor Khach, Google OAuth matches the SRS actor for UC-05",
        "Route /login is reachable"
      ],
      "steps": [
        "Mở /login",
        "Thực hiện Dang nhap bang Google với dữ liệu: provider, redirectTo"
      ],
      "expected": [
        "Google OAuth starts and returns through the auth callback successfully",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "provider, redirectTo are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-AUTH-UC05-02",
      "kind": "required_fields",
      "title": "Dang nhap bang Google - trường bắt buộc",
      "preconditions": [
        "Actor Khach, Google OAuth can reach /login"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (provider, redirectTo)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: provider, redirectTo"
      ]
    },
    {
      "id": "TC-AUTH-UC05-03",
      "kind": "boundary",
      "title": "Dang nhap bang Google - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Khach, Google OAuth can reach /login"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (provider, redirectTo)"
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
      "id": "TC-AUTH-UC05-04",
      "kind": "auth",
      "title": "Dang nhap bang Google - truy cập và phiên đăng nhập",
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
      "id": "TC-AUTH-UC05-05",
      "kind": "permission",
      "title": "Dang nhap bang Google - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-AUTH-UC05-06",
      "kind": "alternative",
      "title": "Dang nhap bang Google - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Khach, Google OAuth can start Dang nhap bang Google"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Dang nhap bang Google"
      ],
      "expected": [
        "OAuth cancellation, disabled provider, or invalid email stops login safely"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-AUTH-UC05-07",
      "kind": "state_transition",
      "title": "Dang nhap bang Google - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Dang nhap bang Google"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "guest moves through external provider state into authenticated session",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-AUTH-UC05-08",
      "kind": "side_effect",
      "title": "Dang nhap bang Google - tác động liên quan",
      "preconditions": [
        "The Dang nhap bang Google happy path has completed once"
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
      "id": "TC-AUTH-UC05-09",
      "kind": "integration",
      "title": "Dang nhap bang Google - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Dang nhap bang Google path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "Google OAuth, Supabase Auth, and callback redirect cooperate without orphan session",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-AUTH-UC05-10",
      "kind": "ui_feedback",
      "title": "Dang nhap bang Google - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Dang nhap bang Google"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "Google button disables while redirecting and surfaces provider errors",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-AUTH-UC05-11",
      "kind": "regression",
      "title": "Dang nhap bang Google - hồi quy sau sửa lỗi",
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
