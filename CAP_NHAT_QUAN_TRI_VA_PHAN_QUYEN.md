# SmartClass - cập nhật quản trị lớp và phân quyền

## Thay đổi
- Thêm `api/classes.ts`: đọc danh sách lớp đã tạo từ Turso để hiển thị trên trang chủ; chỉ phiên Admin hợp lệ mới được ghi danh sách lớp.
- Đồng bộ danh sách lớp lên Turso sau thao tác thêm/xóa trong giao diện quản trị.
- Khi tải ứng dụng, danh sách lớp được lấy từ máy chủ thay vì phụ thuộc riêng vào localStorage của thiết bị.
- Trang đăng nhập hiển thị danh sách lớp ở cả tab GVCN và học sinh; tạo/xóa lớp vẫn nằm trong giao diện Settings của Admin.
- API cấp tài khoản GVCN kiểm tra lớp đã tồn tại trong danh sách Admin tạo.
- Khi Admin xóa lớp, API xóa phiên, thông tin xác thực và dữ liệu Turso theo mã lớp, đồng thời xóa tài khoản GVCN gắn với lớp đó.

## Triển khai
- Giữ nguyên các biến môi trường Turso và `SMARTCLASS_ADMIN_PASSWORD` đang dùng trên Vercel.
- Commit và deploy toàn bộ thư mục dự án, bao gồm endpoint mới `api/classes.ts`.
- Lưu ý: cần kiểm tra lại trên bản Preview/Production với Turso thực tế trước khi sử dụng chính thức. Bản sửa này chưa được build end-to-end trong môi trường hiện tại do quá trình cài dependencies bị timeout.
