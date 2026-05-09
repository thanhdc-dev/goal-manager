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
│       └── log.service.ts          # Quản lý nhật ký tiến độ (Logs)
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

### 🛠️ Linh hoạt tối đa
- Hỗ trợ đa dạng đơn vị đo lường (VND, km, trang sách, giờ học...).
- Chế độ tích lũy linh hoạt: **Hàng ngày** hoặc **Hàng tháng**.
- Quản lý nhật ký tiến độ chi tiết (thêm/sửa/xóa logs).

---

## 💾 Lưu trữ dữ liệu

Toàn bộ dữ liệu được lưu trữ an toàn và riêng tư trong `localStorage` của trình duyệt:
- `gm_goals`: Danh sách các mục tiêu.
- `gm_logs`: Nhật ký tiến độ chi tiết.

*Ứng dụng hoạt động hoàn toàn Offline, không cần server.*

---

## 🛠️ Công nghệ sử dụng

- **Angular 21**: Framework frontend mạnh mẽ và hiện đại nhất.
- **Chart.js**: Thư viện biểu đồ hiệu năng cao cho việc trực quan hóa dữ liệu.
- **SCSS**: Tiền xử lý CSS cho giao diện tinh tế và dễ bảo trì.
- **TypeScript**: Đảm bảo tính nhất quán và an toàn của dữ liệu.

---

## 📦 Đóng gói sản phẩm

```bash
# Build production version
npm run build
# Sản phẩm sẽ nằm trong thư mục: dist/goal-manager/
```

