# 🎯 GoalTracker — MVP

Web app quản lý mục tiêu cá nhân, xây dựng bằng **Angular 18** + **Chart.js**, lưu trữ **localStorage**.

---

## 🚀 Cài đặt & Chạy

```bash
# 1. Cài Node.js 18+ nếu chưa có: https://nodejs.org

# 2. Cài Angular CLI
npm install -g @angular/cli

# 3. Cài dependencies
npm install

# 4. Chạy dev server
ng serve

# 5. Mở trình duyệt
# http://localhost:4200
```

---

## 📁 Cấu trúc project

```
src/app/
├── models/
│   ├── goal.model.ts       # Interface Goal, GoalStats, MilestoneStatus
│   └── log.model.ts        # Interface Log
├── services/
│   ├── goal.service.ts     # CRUD Goals → localStorage
│   ├── log.service.ts      # CRUD Logs → localStorage
│   └── calculation.service.ts  # Toàn bộ logic tính toán
├── components/
│   ├── goal-card/          # Card hiển thị goal ở dashboard
│   ├── log-form/           # Form thêm/sửa log
│   └── progress-chart/     # Doughnut chart (Chart.js)
└── pages/
    ├── dashboard/           # Trang chính — danh sách goals
    └── goal-detail/         # Trang chi tiết — chart, logs, insights
```

---

## ✨ Tính năng

### Quản lý mục tiêu
- ✅ Tạo / Sửa / Xóa mục tiêu
- ✅ Tích lũy hàng ngày hoặc hàng tháng
- ✅ Hỗ trợ mọi đơn vị (VND, km, trang, lần...)

### Theo dõi tiến độ
- ✅ Thêm / Sửa / Xóa log tiến độ
- ✅ Biểu đồ tròn (doughnut) trực quan

### Logic tính toán
| Chỉ số | Công thức |
|--------|-----------|
| Tổng tích lũy | `sum(logs)` |
| % hoàn thành | `current / target × 100` |
| Cần mỗi kỳ | `remaining / remainingPeriods` |
| Tiến độ kỳ vọng | `timePassed / totalTime × 100` |
| Dự đoán cuối kỳ | `avgPerPeriod × totalPeriods` |

### Trạng thái
- 🟢 **Ahead** — vượt kế hoạch (>5% so với kỳ vọng)
- 🟡 **On-track** — đúng kế hoạch (±5%)
- 🔴 **Behind** — chậm tiến độ (<-5%)
- ✅ **Completed** — đã hoàn thành
- ⌛ **Expired** — hết hạn

### Gamification
- 🔥 Streak (ngày/tháng liên tiếp có log)
- 🏅 Milestones tự động: 25% / 50% / 75% / 100%

---

## 💾 Dữ liệu

Lưu trữ hoàn toàn trong `localStorage` của trình duyệt:
- `gm_goals` — danh sách mục tiêu
- `gm_logs` — lịch sử log

---

## 🛠️ Build production

```bash
ng build
# Output: dist/goal-manager/
```
