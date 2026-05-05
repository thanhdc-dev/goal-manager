# Xây dựng Web App Quản Lý Mục Tiêu (MVP)

## 🎯 Mục tiêu

Bạn là một **full-stack engineer chuyên nghiệp**. Nhiệm vụ của bạn là xây dựng một **web app quản lý mục tiêu (MVP)** với:

* **Frontend**: Angular
* **Lưu trữ**: localStorage (chưa cần backend)

Ứng dụng giúp người dùng:

* Theo dõi tiến độ mục tiêu
* Tính toán cần tích lũy mỗi ngày/tháng
* Tăng động lực thông qua các insight đơn giản

---

## 🧱 Yêu cầu chính

### 1. Quản lý mục tiêu (Goal)

Cấu trúc:

```ts
interface Goal {
  id: string;
  name: string;
  targetValue: number;
  unit: string;
  valueType: "integer" | "decimal";
  startDate: string; // ISO string (YYYY-MM-DD)
  endDate: string;   // ISO string (YYYY-MM-DD)
  accumulationType: 'daily' | 'monthly';
  description?: string;
  createdAt: string; // ISO string
}
```

Chức năng:

* Tạo mục tiêu
* Sửa mục tiêu
* Xóa mục tiêu
* Danh sách mục tiêu

---

### 2. Ghi nhận tiến độ (Log)

Người dùng cập nhật tiến độ bằng log:

```ts
interface Log {
  id: string;
  goalId: string;
  value: number;
  date: string; // ISO string (YYYY-MM-DD)
  note?: string;
  createdAt: string; // ISO string
}
```

Chức năng:

* Thêm log (+value)
* Sửa log
* Xóa log
* Xem lịch sử theo từng goal

---

## 🧮 Logic tính toán (RẤT QUAN TRỌNG)

### 1. Tổng đã tích lũy

```ts
currentValue = sum(all logs of goal)
```

---

### 2. % hoàn thành

```ts
progress = (currentValue / targetValue) * 100
```

---

### 3. Số còn lại

```ts
remaining = targetValue - currentValue
```

---

### 4. Số kỳ còn lại

Nếu `monthly`:

```ts
remainingMonths = endMonth - currentMonth
```

Nếu `daily`:

```ts
remainingDays = (endDate - currentDate)
```

---

### 5. Số cần tích lũy mỗi kỳ (GIÁ TRỊ CỐT LÕI)

```ts
requiredPerPeriod = remaining / remainingPeriods
```

---

### 6. Tiến độ kỳ vọng

```ts
expectedProgress = (timePassed / totalTime) * 100
```

---

### 7. Trạng thái tiến độ

```ts
if (actual > expected) → "ahead"
if (~equal) → "on-track"
if (actual < expected) → "behind"
```

---

### 8. Dự đoán (Insight quan trọng)

```ts
avgPerPeriod = currentValue / elapsedPeriods
predictedTotal = avgPerPeriod * totalPeriods
```

Hiển thị:

* “Bạn sẽ KHÔNG đạt mục tiêu nếu giữ tốc độ hiện tại”

---

## 🎮 Gamification (nhẹ)

### 1. Streak

* Đếm số ngày/tháng liên tiếp có cập nhật

---

### 2. Milestones

Tự động:

* 25%
* 50%
* 75%
* 100%

---

### 3. Trạng thái hiển thị

* 🟢 Ahead (vượt kế hoạch)
* 🟡 On-track (đúng kế hoạch)
* 🔴 Behind (chậm tiến độ)

---

## 💾 Lưu trữ (localStorage)

```ts
localStorage.setItem('goals', JSON.stringify(goals))
localStorage.setItem('logs', JSON.stringify(logs))
```

---

## 🧩 Kiến trúc Angular

```text
src/app/
  ├── models/
  │     ├── goal.model.ts
  │     ├── log.model.ts
  ├── services/
  │     ├── goal.service.ts
  │     ├── log.service.ts
  ├── pages/
  │     ├── dashboard/
  │     ├── goal-detail/
  ├── components/
  │     ├── goal-card/
  │     ├── progress-chart/
  │     ├── log-form/
```

---

## 🖥️ UI/UX

### Trang Dashboard

* Danh sách mục tiêu
* Mỗi mục tiêu hiển thị:

  * Tên
  * % hoàn thành
  * Số còn lại
  * Số cần tích lũy mỗi kỳ

---

### Trang Chi tiết Goal

* Biểu đồ tròn (progress)

* Hiển thị:

  > “Bạn cần X mỗi ngày/tháng để đạt mục tiêu”

* Form nhập log:

  * value
  * date
  * description

* Lịch sử:

  * sửa / xóa

---

## 📊 Biểu đồ

* Sử dụng `chart.js` hoặc `ng2-charts`
* Pie chart cho tiến độ

---

## ⚠️ Edge Cases

Xử lý:

* Chia cho 0
* Khi tính tổng số ngày giữa hai ngày chỉ quan tâm đến ngày tháng năm (không có giờ/phút/giây). Sử dụng Date.UTC
* Quá hạn (currentDate > endDate)
* Đã hoàn thành (remaining <= 0)

---

## 🚀 Deliverables

Sinh ra:

### 1. Code Angular

* Models
* Services (localStorage)
* Components
* Pages

---

### 2. Logic nghiệp vụ

* Hàm tính toán
* Xác định trạng thái
* Dự đoán

---

### 3. UI

* Giao diện đơn giản, rõ ràng
* Có thể dùng Angular Material

---

## 🧠 Lưu ý quan trọng

* Giữ đơn giản (MVP)
* Tập trung vào **thông tin dễ hiểu**
* Nhấn mạnh thông điệp:

> “Bạn cần X mỗi kỳ để đạt mục tiêu”

---

## 🔥 Tiêu chí thành công

* Người dùng biết:

  * cần làm gì tiếp theo
* Dễ theo dõi tiến độ
* Có động lực quay lại sử dụng

---

## ❗ Không làm

* Không dùng backend
* Không thêm feature phức tạp
* Không làm UI rườm rà
