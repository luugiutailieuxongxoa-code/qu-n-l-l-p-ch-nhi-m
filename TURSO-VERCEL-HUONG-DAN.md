# Kết nối Vercel + Turso (Local-first, migration-safe)

## Những gì đã thêm
- `api/storage.ts`: Vercel Function dùng `@libsql/client` để tạo bảng `app_storage` và đọc/ghi các key `smartclass_*`.
- `src/utils/tursoSync.ts`: giữ `localStorage` để giao diện cũ hoạt động; lúc mở app, dữ liệu đã có trên Turso được tải xuống, key chỉ có ở trình duyệt được đẩy lên Turso. Token không nằm ở frontend.
- `vercel.json`: build Vite và triển khai API.
- `package.json`: thêm `@libsql/client` và `@vercel/node`.

## Triển khai
1. Upload/commit toàn bộ file trong ZIP vào repository GitHub, giữ nguyên cấu trúc thư mục.
2. Trong Vercel, mở Project > Settings > Environment Variables.
3. Thêm `TURSO_DATABASE_URL` = URL `libsql://...` lấy từ Turso.
4. Thêm `TURSO_AUTH_TOKEN` = token database từ Turso.
5. Chọn Production (và Preview nếu cần), Save.
6. Vào Deployments > Redeploy deployment mới nhất hoặc commit một thay đổi để chạy build mới.
7. Sau khi Ready, mở URL Vercel. Mở DevTools Network nếu muốn kiểm tra `/api/storage`; không chia sẻ token.

## Lưu ý quan trọng
- Lần đầu mở app trên một trình duyệt có dữ liệu cũ: những key chưa có trên Turso sẽ được tải lên. Nếu key đã có trên Turso, giá trị Turso sẽ ghi đè giá trị local cùng key. Trước khi dùng, hãy sao lưu dữ liệu quan trọng từ trình duyệt cũ.
- Đây là cầu nối lưu trữ ban đầu, không phải hệ thống phân quyền hoàn chỉnh. Endpoint hiện chưa xác thực danh tính người dùng; không dùng dữ liệu nhạy cảm/triển khai cho nhiều giáo viên trước khi bổ sung đăng nhập phía máy chủ, phân quyền theo lớp và audit log.
- Bản đầu không đồng bộ thao tác xóa localStorage để tránh xóa nhầm dữ liệu chung. Xóa lớp hoặc xóa dữ liệu cần được thiết kế thành thao tác API có kiểm soát.
- Đồng bộ hiện ghi từng key theo kiểu last-write-wins; không có khóa/merge theo trường nên không phù hợp để nhiều người chỉnh sửa cùng một key đồng thời. Cần bổ sung optimistic locking/phiên bản và xác thực trước khi dùng rộng rãi.
- Vite dev server không tự chạy Vercel Functions; API này hoạt động khi triển khai lên Vercel. Nếu `/api/storage` trả 500, kiểm tra tên hai biến môi trường và Redeploy.
- Không đưa `.env`, token, hay thông tin bí mật lên GitHub.
