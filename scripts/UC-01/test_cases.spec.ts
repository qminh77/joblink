import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-01",
  "module": "M01",
  "title": "Dang ky tai khoan ca nhan",
  "actor": "Khach",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/register",
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
      "id": "TC-AUTH-UC01-01",
      "kind": "functional",
      "title": "Dang ky tai khoan ca nhan - luồng chính",
      "preconditions": [
        "Actor Khach matches the SRS actor for UC-01",
        "Route /register is reachable"
      ],
      "steps": [
        "Mở /register",
        "Thực hiện Dang ky tai khoan ca nhan với dữ liệu: fullName, email, password, termsAccepted"
      ],
      "expected": [
        "member account is created with role member and verification email is requested",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "fullName, email, password, termsAccepted are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-AUTH-UC01-02",
      "kind": "required_fields",
      "title": "Dang ky tai khoan ca nhan - trường bắt buộc",
      "preconditions": [
        "Actor Khach can reach /register"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (fullName, email, password, termsAccepted)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: fullName, email, password, termsAccepted"
      ]
    },
    {
      "id": "TC-AUTH-UC01-03",
      "kind": "boundary",
      "title": "Dang ky tai khoan ca nhan - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Khach can reach /register"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (fullName, email, password, termsAccepted)"
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
      "id": "TC-AUTH-UC01-04",
      "kind": "auth",
      "title": "Dang ky tai khoan ca nhan - truy cập và phiên đăng nhập",
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
      "id": "TC-AUTH-UC01-05",
      "kind": "permission",
      "title": "Dang ky tai khoan ca nhan - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-AUTH-UC01-06",
      "kind": "alternative",
      "title": "Dang ky tai khoan ca nhan - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Khach can start Dang ky tai khoan ca nhan"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Dang ky tai khoan ca nhan"
      ],
      "expected": [
        "duplicate email, weak password, or missing terms is rejected"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-AUTH-UC01-07",
      "kind": "state_transition",
      "title": "Dang ky tai khoan ca nhan - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Dang ky tai khoan ca nhan"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "guest state moves to registered account waiting for email verification",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-AUTH-UC01-08",
      "kind": "side_effect",
      "title": "Dang ky tai khoan ca nhan - tác động liên quan",
      "preconditions": [
        "The Dang ky tai khoan ca nhan happy path has completed once"
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
      "id": "TC-AUTH-UC01-09",
      "kind": "integration",
      "title": "Dang ky tai khoan ca nhan - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Dang ky tai khoan ca nhan path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "Supabase Auth user and public.users mirror are created consistently",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-AUTH-UC01-10",
      "kind": "ui_feedback",
      "title": "Dang ky tai khoan ca nhan - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Dang ky tai khoan ca nhan"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "register form keeps safe input and highlights invalid required fields",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-AUTH-UC01-11",
      "kind": "regression",
      "title": "Dang ky tai khoan ca nhan - hồi quy sau sửa lỗi",
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
