import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-04",
  "module": "M01",
  "title": "Dang nhap bang email va mat khau",
  "actor": "Khach",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/login",
  "codeEntry": "src/features/auth/hooks/use-login.ts",
  "flow": [
    "public auth route",
    "auth component/hook",
    "auth action/client",
    "Supabase Auth",
    "public.users mirror"
  ],
  "cases": [
    {
      "id": "TC-AUTH-UC04-01",
      "kind": "functional",
      "title": "Dang nhap bang email va mat khau - luồng chính",
      "preconditions": [
        "Actor Khach matches the SRS actor for UC-04",
        "Route /login is reachable"
      ],
      "steps": [
        "Mở /login",
        "Thực hiện Dang nhap bang email va mat khau với dữ liệu: email, password"
      ],
      "expected": [
        "valid email/password signs in and loads the app user mirror",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "email, password are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-AUTH-UC04-02",
      "kind": "required_fields",
      "title": "Dang nhap bang email va mat khau - trường bắt buộc",
      "preconditions": [
        "Actor Khach can reach /login"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (email, password)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: email, password"
      ]
    },
    {
      "id": "TC-AUTH-UC04-03",
      "kind": "boundary",
      "title": "Dang nhap bang email va mat khau - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Khach can reach /login"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (email, password)"
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
      "id": "TC-AUTH-UC04-04",
      "kind": "auth",
      "title": "Dang nhap bang email va mat khau - truy cập và phiên đăng nhập",
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
      "id": "TC-AUTH-UC04-05",
      "kind": "permission",
      "title": "Dang nhap bang email va mat khau - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-AUTH-UC04-06",
      "kind": "alternative",
      "title": "Dang nhap bang email va mat khau - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Khach can start Dang nhap bang email va mat khau"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Dang nhap bang email va mat khau"
      ],
      "expected": [
        "wrong credentials or missing app user mirror signs out and shows safe error"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-AUTH-UC04-07",
      "kind": "state_transition",
      "title": "Dang nhap bang email va mat khau - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Dang nhap bang email va mat khau"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "guest session moves to authenticated session when UC-06 passes",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-AUTH-UC04-08",
      "kind": "side_effect",
      "title": "Dang nhap bang email va mat khau - tác động liên quan",
      "preconditions": [
        "The Dang nhap bang email va mat khau happy path has completed once"
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
      "id": "TC-AUTH-UC04-09",
      "kind": "integration",
      "title": "Dang nhap bang email va mat khau - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Dang nhap bang email va mat khau path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "Supabase Auth session and public.users role/status checks stay consistent",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-AUTH-UC04-10",
      "kind": "ui_feedback",
      "title": "Dang nhap bang email va mat khau - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Dang nhap bang email va mat khau"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "login form shows loading, success redirect, and translated error states",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-AUTH-UC04-11",
      "kind": "regression",
      "title": "Dang nhap bang email va mat khau - hồi quy sau sửa lỗi",
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
