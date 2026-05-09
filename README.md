# 🎯 GoalTracker — Modern Goal Management

Hệ thống quản lý mục tiêu cá nhân hiện đại, được xây dựng trên nền tảng **Angular 21** kết hợp với **Chart.js**, tập trung vào tính trực quan và khả năng theo dõi tiến độ chính xác.

---

## 🚀 Khởi động nhanh

```bash
# 1. Cài đặt các phụ thuộc
npm install

# 2. Chạy môi trường phát triển
npm start

# 3. Mở trình duyệt tại:
# http://localhost:4200
```

---

## 🏗️ Kiến trúc dự án

Dự án tuân thủ cấu trúc thư mục tiêu chuẩn của Angular với sự phân tách rõ ràng giữa Logic (Services) và Giao diện (Components/Pages).

```text
src/app/
├── core/
│   └── services/           # Logic nghiệp vụ & Xử lý dữ liệu
│       ├── calculation.service.ts  # Thuật toán tính toán tiến độ & dự báo
│       ├── goal.service.ts         # Quản lý Goals (CRUD)
│       ├── log.service.ts          # Quản lý nhật ký tiến độ (Logs)
│       ├── theme.service.ts        # Quản lý Dark/Light mode
│       └── pwa-update.service.ts   # Quản lý cập nhật PWA tự động
├── shared/
│   └── models/             # Định nghĩa dữ liệu (Interfaces/Enums)
│       ├── goal.model.ts       # Goal, Stats, Milestones, Status
│       └── log.model.ts        # Log structure
├── components/             # Các thành phần giao diện tái sử dụng
│   ├── goal-card/          # Hiển thị tóm tắt mục tiêu
│   ├── goal-form/          # Form tạo và chỉnh sửa mục tiêu
│   ├── log-form/           # Form ghi nhận tiến độ mới
│   └── progress-chart/     # Biểu đồ Doughnut trực quan (Chart.js)
└── pages/                  # Các trang chính của ứng dụng
    ├── dashboard/          # Trang tổng quan danh sách mục tiêu
    └── goal-detail/        # Trang chi tiết, biểu đồ và lịch sử log
```

---

## ✨ Tính năng nổi bật

### 📊 Phân tích tiến độ thông minh
Hệ thống không chỉ đếm số lượng mà còn phân tích sâu dữ liệu của bạn:
- **Trạng thái thực tế**: Tự động đánh giá trạng thái dựa trên thời gian:
  - 🟢 **Ahead**: Vượt mức kỳ vọng.
  - 🔴 **Behind**: Chậm tiến độ so với kế hoạch.
  - ✅ **Completed**: Đã hoàn thành.
  - ⌛ **Expired**: Đã quá hạn.
- **Dự báo (Prediction)**: Dựa trên tốc độ hiện tại để dự đoán khả năng hoàn thành mục tiêu.
- **Tốc độ cần thiết**: Tính toán chính xác lượng cần tích lũy mỗi ngày/tháng để đạt đích đúng hạn.

### 🎮 Gamification & Động lực
- **Hệ thống Streak**: Theo dõi chuỗi ngày/tháng liên tục ghi nhận tiến độ.
- **Milestones**: Tự động đánh dấu các mốc quan trọng (25%, 50%, 75%, 100%).

### 🎨 Cá nhân hóa & Giao diện
- **Dark & Light Mode**: Hỗ trợ đầy đủ chế độ nền tối/sáng, bảo vệ mắt và tiết kiệm pin.
- **Tùy chỉnh màu sắc**: Chọn màu sắc chủ đạo riêng cho từng mục tiêu (Tài chính: Xanh lá, Sức khỏe: Cam, Học tập: Tím...) để dễ dàng phân loại và theo dõi trực quan.
- **Thiết kế Premium**: Giao diện hiện đại, hiệu ứng chuyển cảnh mềm mại và trải nghiệm người dùng mượt mà.

### 🛠️ Linh hoạt tối đa
- Hỗ trợ đa dạng đơn vị đo lường (VND, km, trang sách, giờ học...).
- Chế độ tích lũy linh hoạt: **Hàng ngày** hoặc **Hàng tháng**.
- Quản lý nhật ký tiến độ chi tiết (thêm/sửa/xóa logs).

---

## 💾 Lưu trữ dữ liệu

Toàn bộ dữ liệu được lưu trữ an toàn và riêng tư trong `localStorage` của trình duyệt:
- `gm_goals`: Danh sách các mục tiêu.
- `gm_logs`: Nhật ký tiến độ chi tiết.
- `gm_theme`: Tùy chọn giao diện người dùng (Dark/Light).

*Ứng dụng hoạt động hoàn toàn Offline, không cần server.*

---

## 🛠️ Công nghệ sử dụng

- **Angular 21**: Sử dụng **Signals** cho State Management giúp tăng hiệu suất cực cao.
- **Angular Service Worker**: PWA, caching, offline support.
- **Chart.js**: Thư viện biểu đồ hiệu năng cao cho việc trực quan hóa dữ liệu.
- **SCSS**: Tiền xử lý CSS cho giao diện tinh tế và dễ bảo trì.
- **TypeScript**: Đảm bảo tính nhất quán và an toàn của dữ liệu.

---

## 📱 PWA — Cài đặt như ứng dụng native

GoalTracker là một **Progressive Web App** — có thể cài đặt và sử dụng như ứng dụng thật trên điện thoại và máy tính.

### Cài đặt trên điện thoại (iOS / Android)
1. Mở GoalTracker trong trình duyệt Safari (iOS) hoặc Chrome (Android).
2. Nhấn nút **Share** (iOS) hoặc menu ⋮ (Android).
3. Chọn **"Thêm vào Màn hình chính"** / **"Add to Home Screen"**.
4. Ứng dụng sẽ xuất hiện như một app thật — không có thanh địa chỉ trình duyệt.

### Cài đặt trên máy tính (Chrome / Edge)
1. Mở GoalTracker trong Chrome hoặc Edge.
2. Nhấn biểu tượng **cài đặt** (⊕) ở góc phải thanh địa chỉ.
3. Chọn **"Cài đặt GoalTracker"**.

### Tính năng Offline
- Ứng dụng hoạt động **hoàn toàn không cần Internet** sau lần truy cập đầu tiên.
- Service Worker tự động cache toàn bộ tài nguyên (JS, CSS, icons).
- Khi có phiên bản mới, ứng dụng sẽ **thông báo và tự cập nhật**.

---

## 📦 Đóng gói sản phẩm

```bash
# Build production version
npm run build
# Sản phẩm sẽ nằm trong thư mục: dist/goal-manager/
```

