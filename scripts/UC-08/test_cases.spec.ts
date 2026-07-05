import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-08",
  "module": "M01",
  "title": "Dang xuat khoi he thong",
  "actor": "Nguoi dung",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "profile menu",
  "codeEntry": "src/features/auth/api/auth-client.ts",
  "flow": [
    "public auth route",
    "auth component/hook",
    "auth action/client",
    "Supabase Auth",
    "public.users mirror"
  ],
  "cases": [
    {
      "id": "TC-AUTH-UC08-01",
      "kind": "functional",
      "title": "Dang xuat khoi he thong - luồng chính",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-08",
        "Route profile menu is reachable"
      ],
      "steps": [
        "Mở profile menu",
        "Thực hiện Dang xuat khoi he thong với dữ liệu: session"
      ],
      "expected": [
        "signed-in user signs out and local session is cleared",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "session are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-AUTH-UC08-02",
      "kind": "required_fields",
      "title": "Dang xuat khoi he thong - trường bắt buộc",
      "preconditions": [
        "Actor Nguoi dung can reach profile menu"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (session)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: session"
      ]
    },
    {
      "id": "TC-AUTH-UC08-03",
      "kind": "boundary",
      "title": "Dang xuat khoi he thong - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Nguoi dung can reach profile menu"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (session)"
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
      "id": "TC-AUTH-UC08-04",
      "kind": "auth",
      "title": "Dang xuat khoi he thong - truy cập và phiên đăng nhập",
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
      "id": "TC-AUTH-UC08-05",
      "kind": "permission",
      "title": "Dang xuat khoi he thong - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-AUTH-UC08-06",
      "kind": "alternative",
      "title": "Dang xuat khoi he thong - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Nguoi dung can start Dang xuat khoi he thong"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Dang xuat khoi he thong"
      ],
      "expected": [
        "repeat logout or expired session remains idempotent"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-AUTH-UC08-07",
      "kind": "state_transition",
      "title": "Dang xuat khoi he thong - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Dang xuat khoi he thong"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "authenticated session moves to guest state",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-AUTH-UC08-08",
      "kind": "side_effect",
      "title": "Dang xuat khoi he thong - tác động liên quan",
      "preconditions": [
        "The Dang xuat khoi he thong happy path has completed once"
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
      "id": "TC-AUTH-UC08-09",
      "kind": "integration",
      "title": "Dang xuat khoi he thong - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Dang xuat khoi he thong path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "Supabase client session, middleware cookie state, and router redirect align",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-AUTH-UC08-10",
      "kind": "ui_feedback",
      "title": "Dang xuat khoi he thong - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Dang xuat khoi he thong"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "menu item shows progress and returns to login/public surface",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-AUTH-UC08-11",
      "kind": "regression",
      "title": "Dang xuat khoi he thong - hồi quy sau sửa lỗi",
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
