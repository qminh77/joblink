import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-06",
  "module": "M01",
  "title": "Kiem tra dieu kien truy cap tai khoan",
  "actor": "Tac vu tu dong",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "protected routes",
  "codeEntry": "src/features/auth/api/auth-server.ts",
  "flow": [
    "public auth route",
    "auth component/hook",
    "auth action/client",
    "Supabase Auth",
    "public.users mirror"
  ],
  "cases": [
    {
      "id": "TC-AUTH-UC06-01",
      "kind": "functional",
      "title": "Kiem tra dieu kien truy cap tai khoan - luồng chính",
      "preconditions": [
        "Actor Tac vu tu dong matches the SRS actor for UC-06",
        "Route protected routes is reachable"
      ],
      "steps": [
        "Mở protected routes",
        "Thực hiện Kiem tra dieu kien truy cap tai khoan với dữ liệu: authSession, userStatus, role"
      ],
      "expected": [
        "active allowed account passes access gate for protected routes/actions",
        "Luồng chính thành công"
      ],
      "dataChecks": [
        "authSession, userStatus, role are persisted or returned correctly"
      ]
    },
    {
      "id": "TC-AUTH-UC06-02",
      "kind": "required_fields",
      "title": "Kiem tra dieu kien truy cap tai khoan - trường bắt buộc",
      "preconditions": [
        "Actor Tac vu tu dong can reach protected routes"
      ],
      "steps": [
        "Bỏ trống từng trường bắt buộc hoặc xác nhận bắt buộc rồi gửi form/thao tác. (authSession, userStatus, role)"
      ],
      "expected": [
        "Hệ thống chặn lưu.",
        "Báo lỗi đúng trường.",
        "Dữ liệu cũ không đổi."
      ],
      "dataChecks": [
        "Required fields are enforced: authSession, userStatus, role"
      ]
    },
    {
      "id": "TC-AUTH-UC06-03",
      "kind": "boundary",
      "title": "Kiem tra dieu kien truy cap tai khoan - dữ liệu biên và sai định dạng",
      "preconditions": [
        "Actor Tac vu tu dong can reach protected routes"
      ],
      "steps": [
        "Nhập dữ liệu min/max, quá giới hạn, sai định dạng hoặc file sai loại/dung lượng nếu UC có file. (authSession, userStatus, role)"
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
      "id": "TC-AUTH-UC06-04",
      "kind": "auth",
      "title": "Kiem tra dieu kien truy cap tai khoan - truy cập và phiên đăng nhập",
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
      "id": "TC-AUTH-UC06-05",
      "kind": "permission",
      "title": "Kiem tra dieu kien truy cap tai khoan - phân quyền và trạng thái nghiệp vụ",
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
      "id": "TC-AUTH-UC06-06",
      "kind": "alternative",
      "title": "Kiem tra dieu kien truy cap tai khoan - ngoại lệ nghiệp vụ",
      "preconditions": [
        "Actor Tac vu tu dong can start Kiem tra dieu kien truy cap tai khoan"
      ],
      "steps": [
        "Thực hiện ngoại lệ nghiệp vụ cho Kiem tra dieu kien truy cap tai khoan"
      ],
      "expected": [
        "suspended, banned, deleted, or pending company account is blocked"
      ],
      "dataChecks": [
        "No partial mutation is committed"
      ]
    },
    {
      "id": "TC-AUTH-UC06-07",
      "kind": "state_transition",
      "title": "Kiem tra dieu kien truy cap tai khoan - chuyển trạng thái",
      "preconditions": [
        "Record the starting state before Kiem tra dieu kien truy cap tai khoan"
      ],
      "steps": [
        "Ghi nhận trạng thái trước/sau khi hoàn tất luồng chính; tải lại màn hình liên quan."
      ],
      "expected": [
        "session request moves to allowed, redirected, or signed-out state",
        "Trạng thái mới đúng SRS.",
        "Không có trạng thái loại trừ nhau.",
        "Thao tác lặp được xử lý rõ."
      ],
      "dataChecks": [
        "Old and new state are not both active"
      ]
    },
    {
      "id": "TC-AUTH-UC06-08",
      "kind": "side_effect",
      "title": "Kiem tra dieu kien truy cap tai khoan - tác động liên quan",
      "preconditions": [
        "The Kiem tra dieu kien truy cap tai khoan happy path has completed once"
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
      "id": "TC-AUTH-UC06-09",
      "kind": "integration",
      "title": "Kiem tra dieu kien truy cap tai khoan - tích hợp dữ liệu",
      "preconditions": [
        "Complete the main Kiem tra dieu kien truy cap tai khoan path once"
      ],
      "steps": [
        "Thực hiện UC qua giao diện; kiểm tra dữ liệu, file, thông báo hoặc số đếm phát sinh."
      ],
      "expected": [
        "middleware/auth-server guards agree on user status and role",
        "Dữ liệu được tạo/sửa/xóa đúng phạm vi.",
        "Quyền truy cập dữ liệu được bảo vệ.",
        "Các phần liên quan hiển thị nhất quán."
      ],
      "dataChecks": [
        "Related cache/revalidation is consistent"
      ]
    },
    {
      "id": "TC-AUTH-UC06-10",
      "kind": "ui_feedback",
      "title": "Kiem tra dieu kien truy cap tai khoan - phản hồi giao diện",
      "preconditions": [
        "Open the UI surface for Kiem tra dieu kien truy cap tai khoan"
      ],
      "steps": [
        "Kiểm tra loading, success, validation error, empty/error state; thử submit nhanh và màn hình mobile cơ bản."
      ],
      "expected": [
        "user sees login reason instead of a blank protected page",
        "Có phản hồi rõ ràng.",
        "Không kẹt loading hoặc stale UI.",
        "Layout không vỡ ở mobile phổ biến."
      ],
      "dataChecks": [
        "Visible state matches action/query result"
      ]
    },
    {
      "id": "TC-AUTH-UC06-11",
      "kind": "regression",
      "title": "Kiem tra dieu kien truy cap tai khoan - hồi quy sau sửa lỗi",
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
