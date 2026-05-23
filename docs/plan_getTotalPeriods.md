# Kế hoạch chỉnh sửa hàm getTotalPeriods và logic tính toán chu kỳ tháng (monthly)

Tài liệu này ghi lại kế hoạch khắc phục lỗi tính toán chu kỳ của mục tiêu loại "monthly" khi ngày bắt đầu và ngày kết thúc nằm ở các năm khác nhau.

## Vấn đề hiện tại
Trong file `src/app/core/services/calculation.service.ts`, các hàm tính toán chu kỳ tháng như `diffInMonths`, `getElapsedPeriods`, và `getTotalPeriods` chỉ thực hiện lấy hiệu số của tháng (`endMonth - startMonth + 1`).
Điều này dẫn đến kết quả sai lệch khi khoảng thời gian trải qua nhiều năm. Ví dụ:
- Bắt đầu: `01/01/2025`, Kết thúc: `01/01/2026`
- Kết quả hiện tại: `0 - 0 + 1 = 1` tháng (do cả hai đều là tháng 1).
- Kết quả mong muốn: `12` tháng.

---

## Giải pháp đề xuất

### 1. Đồng bộ hóa và sửa hàm `diffInMonths`
Chúng ta sửa lại hàm `diffInMonths` để tính thêm hiệu số năm, kết hợp kiểm tra ngày trong tháng để không tính dư tháng khi kết thúc vào ngày đầu tháng:
```typescript
private diffInMonths(start: Date, end: Date): number {
  const yearsDiff = end.getFullYear() - start.getFullYear();
  const monthsDiff = end.getMonth() - start.getMonth();
  let total = yearsDiff * 12 + monthsDiff;
  
  // Nếu ngày kết thúc vượt qua ngày bắt đầu của tháng tiếp theo (ví dụ 15/01 -> 16/02)
  // thì ta tính thêm 1 kỳ nữa.
  if (end.getDate() > start.getDate()) {
    total += 1;
  }
  
  return Math.max(1, total);
}
```

### 2. Tái cấu trúc `getTotalPeriods` và `getElapsedPeriods`
Chúng ta sẽ loại bỏ việc tính toán trùng lặp ở `getTotalPeriods` và `getElapsedPeriods` bằng cách chuyển sang sử dụng hàm `diffInMonths` tập trung:
```typescript
private getTotalPeriods(goal: Goal, start: Date, end: Date): number {
  if (goal.accumulationType === "daily") {
    return this.diffInDays(start, end);
  }
  return this.diffInMonths(start, end);
}

private getElapsedPeriods(goal: Goal, start: Date, now: Date): number {
  if (now <= start) return 0;
  if (goal.accumulationType === "daily") {
    return this.diffInDays(start, now);
  }
  return this.diffInMonths(start, now);
}
```

### 3. Xử lý trường hợp biên cho mục tiêu bắt đầu trong tương lai
Thêm kiểm tra điều kiện `now <= start` vào đầu hàm `getExpectedProgress` để tránh việc tính toán tiến độ kỳ vọng sai lệch khi thời điểm hiện tại nằm trước ngày bắt đầu của mục tiêu.

---

## Danh sách tệp chỉnh sửa
- `src/app/core/services/calculation.service.ts`

---

## Kế hoạch Xác minh (Verification Plan)

### Kiểm thử tự động qua script chạy thử độc lập
Chúng tôi đã tạo một test script độc lập để chạy thử logic này với các trường hợp biên:
- `01/01/2025` -> `15/01/2025` (Kỳ vọng: 1) -> Đã chạy thử đạt kết quả tốt
- `01/01/2025` -> `01/01/2026` (Kỳ vọng: 12) -> Đã chạy thử đạt kết quả tốt
- `01/01/2025` -> `31/12/2025` (Kỳ vọng: 12) -> Đã chạy thử đạt kết quả tốt
- `15/01/2025` -> `15/02/2025` (Kỳ vọng: 1) -> Đã chạy thử đạt kết quả tốt
- `15/01/2025` -> `16/02/2025` (Kỳ vọng: 2) -> Đã chạy thử đạt kết quả tốt

### Kiểm thử thủ công trên ứng dụng
1. Build dự án Angular cục bộ bằng lệnh `npm run build` để kiểm tra lỗi biên dịch TypeScript.
2. Khởi chạy dev server (`npm run dev`) và truy cập ứng dụng.
3. Tạo hoặc cập nhật một mục tiêu có `accumulationType = monthly`, ngày bắt đầu `01/01/2025` và ngày kết thúc `01/01/2026`.
4. Xác minh giao diện Goal Detail hiển thị đúng số lượng `12 tháng` làm chu kỳ tổng số.
