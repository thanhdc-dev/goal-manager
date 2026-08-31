# Implementation Notes — GoalTracker Dashboard v2 Upgrade

Tài liệu này ghi lại các quyết định thiết kế, thay đổi kỹ thuật, và đánh đổi (tradeoffs) được thực hiện trong quá trình nâng cấp giao diện Dashboard lên phiên bản v2.

---

## 🛠️ Quyết định Thiết kế & Kỹ thuật

### 1. Thay thế Emoji bằng Tabler Icons qua NPM
- **Quyết định**: Sử dụng gói npm `@tabler/icons-webfont` thay thế cho emoji thô sơ trong giao diện cũ.
- **Cách nhúng**: Nhập trực tiếp qua `@import "@tabler/icons-webfont/dist/tabler-icons.min.css"` trong file CSS chính để tự động đóng gói qua build pipeline của Angular + Tailwind v4.
- **Lợi ích**: Đồng bộ thiết kế với bản mẫu v2, tạo cảm giác giao diện SaaS chuyên nghiệp, độ phân giải sắc nét ở mọi kích cỡ màn hình.

### 2. Thiết kế Lưới Đáp ứng (Responsive Grid)
- **Quyết định**: Thay thế thuộc tính `grid-cols-3` cố định của bản thiết kế tĩnh bằng cấu trúc lưới đáp ứng: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4` (theo ý kiến phản hồi từ người dùng).
- **Lợi ích**: Tránh bị vỡ layout trên các thiết bị di động và máy tính bảng, trong khi vẫn giữ nguyên bố cục 3 cột tuyệt đẹp trên màn hình lớn.

### 3. Động hóa Nhãn Khối Insight màu Hổ phách (Amber Block)
- **Quyết định**: Nhãn của khối cảnh báo hổ phách hiển thị động theo loại chu kỳ của mục tiêu (`accumulationType`):
  - Chu kỳ tháng (`monthly`): Hiển thị `"Tháng tới cần"`
  - Chu kỳ ngày (`daily`): Hiển thị `"Hôm nay cần"`
- **Lợi ích**: Giúp thông điệp trực quan, chính xác với ngữ cảnh mục tiêu của người dùng.

### 4. Xử lý Trạng thái Biên (Edge Cases) cho Khối Insight
- **Quyết định**:
  - Khi mục tiêu đã hoàn thành (`stats().status === 'completed'`), khối insight đổi từ màu hổ phách sang màu xanh lá (`bg-emerald-400/8 border-emerald-400/15 text-emerald-400`) và hiển thị chữ `"Hoàn thành 🎉"`.
  - Khi mục tiêu hết hạn (`stats().status === 'expired'`), khối insight đổi sang màu xám mờ (`bg-app-surface border-app-border text-app-text/50`) và hiển thị chữ `"Đã hết hạn"`.
- **Lợi ích**: Không hiển thị số lượng tiết kiệm kỳ vọng khi mục tiêu không còn cần tích lũy nữa, cải thiện trải nghiệm người dùng thực tế.

---

## ⚖️ Các Điểm Đánh đổi (Tradeoffs) & Điều chỉnh

### 1. Tăng Ngân sách Bundle trong `angular.json`
- **Đánh đổi**: Việc tải font icon nguyên bản thông qua CSS tăng dung lượng tệp tin style ban đầu (`styles.css` đạt ~281 kB), vượt quá giới hạn cảnh báo mặc định (`500kB` cho toàn bộ bundle).
- **Giải pháp**: Tăng giới hạn cảnh báo trong `angular.json` lên `1MB` và lỗi lên `2MB` để đảm bảo quá trình build production diễn ra trơn tru. Điều này chấp nhận được vì dung lượng tệp tin nén tải về thực tế chỉ khoảng `38 kB` (nhờ gzip/brotli), không ảnh hưởng lớn đến hiệu năng tải trang.

### 2. Sử dụng Dynamic CSS variables cho Milestone
- **Đặc trưng**: Bản v2 mẫu gán màu tĩnh (`bg-violet-400/15`) cho milestones. Để giữ tính năng màu sắc động theo từng mục tiêu của GoalTracker, chúng tôi sử dụng CSS variable `--goal-color-soft` và `--goal-color` do Angular tính toán động cho từng thẻ. Điều này giúp các thẻ mục tiêu màu xanh, đỏ, cam vẫn hiển thị đúng màu chủ đạo của chúng ở phần milestones.

---

## 🛠️ Quyết định Thiết kế & Kỹ thuật — Nâng cấp Goal Detail V2

### 1. Thay đổi động màu sắc Progress Chart theo mục tiêu
- **Quyết định**: Cập nhật `ProgressChartComponent` để sử dụng `getComputedStyle(this.canvasRef.nativeElement)` thay vì `getComputedStyle(document.documentElement)`.
- **Lợi ích**: Giúp biểu đồ tròn tự động nhận diện biến `--goal-color` được tính toán riêng biệt cho từng mục tiêu (kế thừa từ phần tử cha), thay vì luôn luôn sử dụng màu xanh/tím accent mặc định của toàn trang.

### 2. Định dạng Thông điệp Dự đoán bằng HTML
- **Quyết định**: Di chuyển phần định dạng in đậm các thông số quan trọng (như giá trị dự báo, lượng cần thêm...) vào `CalculationService.getPredictionMessage()` bằng cách bao bọc chúng bằng thẻ `<strong>`. Bản HTML sử dụng `[innerHTML]` để hiển thị.
- **Lợi ích**: Giữ cho file HTML sạch sẽ, giảm độ phức tạp khi kết hợp chuỗi trong template, đồng thời đồng nhất định dạng ở mọi chế độ xem.

### 3. Thiết kế Lưới 2x4 Đáp ứng (Responsive Stats Grid)
- **Quyết định**: Kết hợp các lớp Tailwind `grid-cols-2 sm:grid-cols-4 lg:grid-cols-2` cho lưới thống kê bên cột trái.
- **Lợi ích**: Trên màn hình lớn (`lg`), lưới hiển thị dạng 2 cột gọn gàng. Trên màn hình máy tính bảng (`sm`), lưới mở rộng ngang thành 4 cột để tiết kiệm không gian đứng. Trên thiết bị di động nhỏ, lưới quay về 2 cột trực quan.

### 4. Hiển thị ngày đạt Milestone dạng phụ (Sub-text)
- **Quyết định**: Hiển thị ngày đạt Milestone (`formatDate(m.reachedAt)`) dạng chữ siêu nhỏ (`text-[7px]`) ngay dưới phần trăm tiến độ, đồng thời tăng chiều cao khối Milestone từ `h-6` lên `h-9`.
- **Lợi ích**: Cung cấp thông tin lịch sử trực quan mà không chiếm nhiều diện tích hoặc gây vỡ giao diện / tràn viền chữ.

---

## 🛠️ Quyết định Thiết kế & Kỹ thuật — Sửa lỗi tính toán chu kỳ tháng (monthly) vượt năm

### 1. Đồng nhất hóa logic tính toán tháng qua `diffInMonths`
- **Quyết định**: Thay thế tất cả các khối code tính toán chênh lệch tháng thủ công rải rác ở `getTotalPeriods`, `getElapsedPeriods` bằng việc gọi hàm tập trung `diffInMonths`.
- **Lợi ích**: Đảm bảo toàn bộ ứng dụng sử dụng chung một thuật toán nhất quán và giảm thiểu rủi ro khi có lỗi phát sinh sau này.

### 2. Xử lý chính xác ngày đầu tháng làm biên kết thúc
- **Quyết định**: Sử dụng công thức `yearsDiff * 12 + monthsDiff` và chỉ tăng thêm `+1` nếu ngày kết thúc lớn hơn ngày bắt đầu của tháng tiếp theo (`end.getDate() > start.getDate()`).
- **Lợi ích**: Giải quyết đúng trường hợp `01/01/2025` đến `01/01/2026` trả về chính xác `12 tháng` (thay vì 13 tháng nếu cộng 1 mù quáng, hoặc 1 tháng nếu chỉ tính hiệu tháng). Đồng thời giữ đúng hành vi `12 tháng` cho chu kỳ từ `01/01/2025` đến `31/12/2025`.

### 3. Ngăn chặn lỗi tiến độ kỳ vọng của mục tiêu tương lai
- **Quyết định**: Thêm điều kiện `if (now <= start) return 0;` ở đầu hàm `getExpectedProgress`.
- **Lợi ích**: Đảm bảo các mục tiêu được lên kế hoạch trong tương lai hiển thị tiến độ dự kiến là `0%` thay vì hiển thị các con số ngẫu nhiên hoặc âm.

---

## 2026-08-31

### Decision
Chuyển toàn bộ tầng auth + đồng bộ dữ liệu từ **Supabase** sang **API nội bộ `https://api.thanhdc.dev`** theo tài liệu `docs/auth-login-v2-integration.md` (OAuth v2: login-url → callback → me/refresh/logout). Login UI hỗ trợ 3 provider (Google/GitHub/Zalo), bỏ Magic Link email. Token lưu ở `localStorage` (`gm_access_token`, `gm_refresh_token`), tự động refresh khi gặp 401 (refresh token rotate).

### Before
- `AuthService` dùng `SupabaseService` (Google OAuth + Magic Link email OTP), theo dõi session qua `onAuthStateChange`/`getSession`.
- `SyncService` ghi/đọc trực tiếp vào Supabase (bảng `goals`/`logs`, snake_case, `user_id` = UUID Supabase).
- `Goal.userId`/`Log.userId` là `string` (UUID Supabase); `environment` chứa `supabaseUrl`/`supabaseKey`.

### After
- `ApiService` (mới) — tầng HTTP gọi `api.thanhdc.dev`: gắn `Authorization: Bearer`, gặp 401 → `POST /auth/refresh` 1 lần → retry; refresh fail → clear token + phát `sessionExpired$` (AuthService tự logout).
- `AuthService` — OAuth v2: `signInWithProvider(provider)` (lấy `authUrl` rồi redirect), `handleCallback(code, state)`, `signOut()` → `DELETE /auth/logout`. Route mới `/auth/callback` xử lý code/state.
- `SyncService` — dùng `ApiService` với hợp đồng REST giả định (camelCase): `GET/POST/PUT/DELETE /goals`, `/logs`; server suy user từ Bearer token (không gửi `user_id`); giữ nguyên offline queue + merge theo `updatedAt`.
- `Goal.userId`/`Log.userId` đổi sang `number` (user.id API trả số).
- `environment`: `apiBaseUrl`, `appKey: 'goal-tracker'`, `providers`.

### Reason
Thống nhất về API nội bộ do BackEnd quản lý OAuth client tập trung (webapp không tự đăng ký OAuth), loại bỏ phụ thuộc bên thứ ba (Supabase) cho cả auth lẫn data sync.

### Alternatives Considered
1. Giữ Supabase cho auth + chỉ thay sync — không khả thi do user id (UUID Supabase ↔ số API) không tương thích, phức tạp.
2. Chỉ thay auth, tắt sync — thu hẹp scope nhưng mất tính năng cloud; user chọn thay cả sync.
3. Dùng httpOnly cookie cho token — SPA/PWA thuần không có backend để set cookie; chọn `localStorage`.

### Assumption / Rủi ro cần theo dõi
- **Hợp đồng REST goals/logs là GIẢ ĐỊNH** (chưa có tài liệu API sync thật) — cần đối chiếu khi BackEnd công bố API chính thức.
- `redirectUri` `/auth/callback` phải trùng cấu hình BackEnd; `appKey` = `goal-tracker` cần được BackEnd đăng ký đủ Google/GitHub/Zalo.
- CORS: BackEnd phải cho phép origin của webapp.
