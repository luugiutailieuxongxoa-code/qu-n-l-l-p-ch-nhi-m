# SmartClass – đăng nhập PIN, phân quyền và đồng bộ Turso

## Các file mới/thay đổi

- `api/_auth.ts`: kết nối Turso, băm PIN bằng scrypt, quản lý phiên cookie HttpOnly.
- `api/auth.ts`: đăng nhập, đăng xuất, cấp/thu hồi PIN và quyền cho học sinh.
- `api/storage.ts`: yêu cầu phiên đăng nhập; giới hạn dữ liệu đọc/ghi theo vai trò.
- `src/utils/authClient.ts`: gọi API xác thực từ giao diện.
- `src/utils/tursoSync.ts`: đồng bộ dữ liệu khi đã đăng nhập, làm mới định kỳ.
- `src/components/LoginScreen.tsx`: GVCN đăng nhập qua API; học sinh phải nhập PIN riêng.
- `src/components/PinManagementPanel.tsx`: GVCN cấp PIN và phân quyền cho học sinh.
- `src/App.tsx`: xác minh cookie trên máy chủ thay vì tin trạng thái đăng nhập trong localStorage; thêm bảng cấp PIN.
- `vercel.json`, `.env.example`: cấu hình endpoint và biến môi trường.

## Cấu hình Vercel

Trong Project → Settings → Environment Variables, đặt:

- `TURSO_DATABASE_URL`: URL cơ sở dữ liệu Turso.
- `TURSO_AUTH_TOKEN`: token Turso.
- `SMARTCLASS_ADMIN_PIN`: PIN riêng của GVCN, 4–8 chữ số. Không dùng PIN mẫu `123456`.

Sau đó Redeploy. Không đưa token hoặc PIN thật vào GitHub.

## Cách khởi tạo

1. GVCN đăng nhập bằng `SMARTCLASS_ADMIN_PIN`.
2. Mở mục Cài đặt → phần “Cấp PIN và phân quyền học sinh”.
3. Chọn từng học sinh, cấp PIN riêng. Học sinh thường chỉ có quyền gửi phản hồi.
4. Muốn cấp quyền ban cán sự: trước tiên phân công học sinh trong mục Ban cán sự của app, sau đó chọn vai trò ban cán sự và bật đúng quyền cần thiết.
5. Gửi đường dẫn ứng dụng và PIN riêng cho từng học sinh qua kênh riêng, không đăng PIN lên nhóm lớp.

## Lưu ý quan trọng

- Dữ liệu cũ trên mỗi trình duyệt không tự biến thành dữ liệu dùng chung cho đến khi GVCN đăng nhập và đồng bộ dữ liệu ban đầu. Hãy kiểm tra dữ liệu đã có trên Turso trước khi cho học sinh dùng.
- API giới hạn quyền theo vai trò cho các key lưu trữ. Với hệ thống có yêu cầu bảo mật cao hơn, nên chuyển dữ liệu nghiệp vụ từ blob JSON sang các bảng riêng (students, attendance, behavior_logs, feedbacks) và kiểm tra quyền từng bản ghi ở API.
- Chạy `npm run build` và `npm run lint` trước khi triển khai. Không triển khai cho học sinh nếu build hoặc kiểm thử đăng nhập chưa đạt.
