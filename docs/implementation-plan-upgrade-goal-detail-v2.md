# Kế hoạch Triển khai Nâng cấp Giao diện Goal Detail (V2)

Tài liệu này đề xuất phương án và các bước chi tiết để nâng cấp giao diện trang chi tiết mục tiêu (`goal-detail`) theo chuẩn thiết kế V2 (`docs/goaltracker_detail_v2.html`), đồng thời tích hợp các phản hồi từ người dùng nhằm bảo toàn dữ liệu và tối ưu trải nghiệm đa thiết bị.

---

## 🎨 Tóm tắt Thiết kế & Quyết định từ Phản hồi

1. **Vị trí Mô tả Mục tiêu (Goal Description)**: 
   - Đặt trên cùng trang chi tiết, ngay dưới thanh điều hướng (Nav) và nằm trên cấu trúc 2 cột.
2. **Lưới thông số Stats Breakdown**:
   - Mở rộng lưới thông số từ 2x2 lên **2x4 (8 ô)** để hiển thị toàn bộ 8 chỉ số của hệ thống mà không làm mất thông tin quan trọng.
3. **Màu sắc Động của Banner Dự đoán (Prediction Banner)**:
   - Thay đổi màu sắc và icon của Banner động theo trạng thái của mục tiêu:
     - **Hoàn thành/Đúng tiến độ/Vượt tiến độ** (`completed`, `ahead`, `on-track`): Tông màu xanh lá (`bg-emerald-400/8 border-emerald-400/15 text-emerald-400`) kèm icon `ti ti-circle-check` hoặc `ti ti-check`.
     - **Chậm tiến độ** (`behind`): Tông màu cam cảnh báo (`bg-orange-400/6 border-orange-400/15 text-orange-400`) kèm icon `ti ti-alert-triangle`.
     - **Hết hạn** (`expired`): Tông màu xám (`bg-app-surface border-app-border text-app-text/50`) kèm icon `ti ti-info-circle`.
4. **Trạng thái Đồng bộ Đám mây (Cloud Sync Status) cho Logs**:
   - Chỉ hiển thị icon đám mây khi có trạng thái đặc biệt:
     - Chờ đồng bộ (`pending`): `ti ti-cloud-upload` màu vàng/cam nhấp nháy.
     - Lỗi đồng bộ (`error`): `ti ti-cloud-off` hoặc `ti ti-cloud-exclamation` màu đỏ.
     - Đã đồng bộ thành công (`synced`): Không hiển thị icon để giữ giao diện sạch sẽ.
5. **Định dạng & Style của Milestones**:
   - Mốc Milestone đã đạt: Sử dụng màu sắc động theo chủ đề của Goal (`bg-[var(--goal-color-soft)] text-[var(--goal-color)] border-[var(--goal-color)]/20`). Hiển thị ngày đạt mốc (`formatDate(m.reachedAt)`) bên dưới phần trăm.
   - Mốc Milestone chưa đạt: Nền mờ (`bg-app-surface text-app-text/20 border-app-border/40`).
6. **Hỗ trợ Light Mode (Semantic Colors)**:
   - Ánh xạ toàn bộ các màu tĩnh từ bản thiết kế V2 sang hệ thống biến màu ngữ nghĩa (semantic variables) của ứng dụng để tự động chuyển đổi giao diện hoàn hảo giữa chế độ Sáng và Tối:
     - `bg-[#0d0d10]` $\rightarrow$ Nền trang chi tiết là `bg-app-bg`, khung thẻ chính là `bg-app-card border border-app-border/80`.
     - `bg-white/4` $\rightarrow$ `bg-app-surface`
     - `border-white/8` $\rightarrow$ `border-app-border`
     - `text-white/40` $\rightarrow$ `text-app-text/40` hoặc `text-app-muted`
     - `text-white` $\rightarrow$ `text-app-text`
     - `text-white/30` $\rightarrow$ `text-app-muted/80`

---

## 🛠️ Các Bước Thực hiện Kỹ thuật

### Bước 1: Chuẩn bị & Tích hợp Icon
- Đảm bảo các lớp icon Tabler (`ti ti-*`) sẵn sàng từ gói `@tabler/icons-webfont` đã cài đặt.
- Loại bỏ toàn bộ emoji tĩnh trong các phần tử điều hướng, thẻ và logs.

### Bước 2: Tái cấu trúc HTML (`src/app/pages/goal-detail/goal-detail.component.html`)
1. **Thanh Điều hướng (Top Navigation)**:
   - Di chuyển nút **Sửa mục tiêu** và **Thêm log** lên thanh điều hướng trên cùng, nằm ngang hàng với nút **Quay lại** (sử dụng cấu trúc `flex items-center justify-between`).
   - Giữ nguyên `routerLink="/"` trên liên kết "Quay lại" để điều hướng về Dashboard.
   - Gán màu nền `--goal-color` cho nút "Thêm log".
2. **Khu vực Header & Description**:
   - Hiển thị tên mục tiêu (`goal()!.name`) cỡ chữ lớn và mô tả mục tiêu (`goal()!.description`) ở ngay dưới thanh điều hướng, nằm trên bố cục 2 cột.
3. **Cột Trái (Thẻ thông tin mục tiêu - Left Sidebar)**:
   - **Thẻ 1 (Tiến độ & Tiêu đề phụ)**:
     - Chứa biểu đồ tròn `<app-progress-chart>`.
     - Chứa Khoảng thời gian mục tiêu (`formatDate(goal()!.startDate) → formatDate(goal()!.endDate)`).
     - Badge Trạng thái và Badge Streak (ngang hàng, thiết kế mềm mại hơn).
   - **Thẻ 2 (Chỉ số kỳ tiếp theo)**:
     - Hiển thị lượng tích lũy cần thiết cho ngày/tháng tiếp theo, ẩn đi nếu mục tiêu đã hoàn thành hoặc hết hạn. Áp dụng màu sắc hổ phách động hoặc màu xanh lá nếu hoàn thành.
   - **Thẻ 3 (Lưới chỉ số 2x4 & Milestones)**:
     - Thiết kế lưới 2 cột, 4 hàng hiển thị 8 thông số:
       1. **Đã tích lũy**: `currentValue` + `unit`
       2. **Mục tiêu**: `targetValue` + `unit`
       3. **Còn lại**: `remaining` + `unit`
       4. **Tích lũy TB/Kỳ**: `avgPerPeriod` + `unit`
       5. **Kỳ còn lại**: `remainingPeriods` / `totalPeriods`
       6. **Tiến độ kỳ vọng**: `expectedProgress` %
       7. **Giá trị kỳ vọng**: `expectedValue` + `unit`
       8. **Dự đoán cuối kỳ**: `predictedTotal` + `unit`
     - Phần **Milestones**: Render danh sách 4 mốc (25%, 50%, 75%, 100%). Sử dụng cấu trúc `@for` của Angular. Áp dụng kiểu dáng động theo trạng thái đạt được.
4. **Cột Phải (Dự đoán & Lịch sử Logs)**:
   - **Banner dự đoán (Prediction Banner)**:
     - Đặt ở đầu cột phải. Sử dụng `[ngClass]` để đổi màu sắc (`bg`, `border`, `text`) và icon Tabler phù hợp với trạng thái của mục tiêu.
   - **Danh sách ghi nhận (Logs History)**:
     - Áp dụng giao diện thẻ log mới của V2.
     - Hiển thị ngày log, giá trị tích lũy (ví dụ: `+100.000 VNĐ`).
     - Tích hợp ghi chú ngắn (`log.note`) nằm bên dưới ngày log nếu có.
     - Kiểm tra trạng thái `syncStatus` để hiển thị icon đám mây tương ứng (`ti-cloud-upload` nhấp nháy cho `pending` hoặc `ti-cloud-off`/`ti-cloud-exclamation` cho `error`).
     - Nút Sửa/Xóa log sử dụng Tabler Icon (`ti-pencil`, `ti-trash`) nhỏ gọn.

### Bước 3: Đảm bảo tính Responsive & Kiểm thử
- Sử dụng các lớp tiện ích Grid và Flexbox của Tailwind CSS để đảm bảo:
  - Trên màn hình lớn (`lg`), hiển thị bố cục 2 cột với cột trái cố định rộng `lg:w-[240px]` và cột phải co giãn tự do.
  - Trên màn hình trung bình (`md`, `sm`) và nhỏ, tự động xếp chồng (stack) thành 1 cột, canh chỉnh lại khoảng cách đệm và kích thước chữ cho vừa vặn.
- Kiểm thử hiển thị trên cả Light Theme và Dark Theme.
