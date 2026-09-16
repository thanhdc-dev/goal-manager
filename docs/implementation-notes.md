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

---

## 2026-09-12

### Decision
Chốt đặc tả backend cho phần **data sync** (goals/logs) và kế hoạch di chuyển hoàn tất sang API nội bộ `https://api.thanhdc.dev`, dựa trên phân tích code hiện tại. Tạo 2 tài liệu mới:

- `docs/backend-api-spec.md` — đặc tả CSDL (bảng/cột/index) + hợp đồng API (endpoint, input/output, validation) dành cho đội Backend.
- `docs/implementation-plan-migrate-supabase-to-api.md` — kế hoạch di chuyển phía Frontend (task breakdown, rủi ro, lộ trình).

Các quyết định đã chốt (qua khảo sát người dùng):
1. **Bỏ qua auth** trong tài liệu mới — OAuth v2 đã migrate xong (commit `9457139`), chỉ tập trung `goals`/`logs`.
2. **ID: server sinh UUID** khi tạo mới, lưu ở cột `key`, trả về client dưới tên `id`. PK `id` (BIGSERIAL) chỉ giữ nội bộ ở backend.
3. **Sync theo REST CRUD full-list** (`GET/POST/PUT/DELETE /goals`, `/logs`) — khớp code hiện tại.
4. **Hard delete** (logs cascade khi xoá goal).
5. **Không migrate** dữ liệu Supabase cũ — bắt đầu mới.
6. Tài liệu **Markdown tiếng Việt** trong `docs/`.

### Before
- Frontend `ApiService`/`SyncService` gọi API nội bộ với **hợp đồng REST giả định** (camelCase, `GET/POST/PUT/DELETE /goals|/logs`), chưa có đặc tả CSDL/API thật cho backend.
- `Goal.id`/`Log.id` do **client** sinh (`crypto.randomUUID()`); ngày lưu dạng ISO đầy đủ (`toISOString()`).

### After
- Có đặc tả backend đầy đủ: 2 bảng `goals`/`logs` (`id BIGSERIAL` nội bộ + `key UUID` công khai + `client_ref` chống trùng), 8 endpoint CRUD, quy tắc validation, format lỗi, index, DDL PostgreSQL.
- Kế hoạch di chuyển xác định: đổi sang **server sinh ID** ⇒ cần cơ chế **reconcile ID** (temp id + `clientRef`) trong `SyncService`; chuẩn hoá ngày về `YYYY-MM-DD`; đảm bảo thứ tự queue goal CREATE trước log CREATE.

### Reason
Backend cần tài liệu mô tả rõ cần tạo bảng/cột nào và API input/output ra sao để hiện thực khớp với hợp đồng frontend. Việc chốt sớm các quyết định (ID, sync model, xoá, migration) giúp freeze hợp đồng trước khi code, tránh sửa lại nhiều lần.

### Alternatives Considered
1. **Client sinh UUID làm public key** — giữ nguyên logic offline hiện tại, đơn giản hơn nhiều; nhưng người dùng chọn server sinh ID. Đã ghi vào mục "Điểm còn bỏ ngỏ" của kế hoạch để cân nhắc lại.
2. **Delta sync (`?since=updatedAt`) + tombstones** — hiệu quả hơn khi dữ liệu lớn nhưng phải sửa `SyncService`; chọn full-list cho giai đoạn này.
3. **Soft delete (`deleted_at`)** — tránh hồi sinh dữ liệu đã xoá ở đa thiết bị; chọn hard delete cho đơn giản.
4. **Migrate dữ liệu Supabase cũ** (map `user_id` UUID → number) — phức tạp, không cần thiết; chọn bắt đầu mới.
5. **OpenAPI YAML** — máy đọc tốt hơn; chọn Markdown tiếng Việt theo yêu cầu.

### Assumption / Rủi ro cần theo dõi
- **Tên field JSON của UUID** (`id` vs `key`) là **giả định** (tài liệu chọn trả về `id` để khớp model frontend) — cần Backend xác nhận.
- Cột `key UUID` + PK `id BIGSERIAL` là thiết kế đề xuất; backend có thể điều chỉnh nếu hệ CSDL khác.
- Bảng `users` được **giả định** có PK `BIGINT` (khớp `AuthUser.id: number`); `user_id` FK cần khớp kiểu thật.
- Chiến lược server sinh ID làm phát sinh rủi ro cao cho luồng offline (reconcile ID) — đã nêu rõ trong kế hoạch.

---

## 2026-09-12 (cập nhật)

### Decision
Đổi chiến lược định danh: **bỏ cột `key UUID` công khai**, dùng **`id BIGSERIAL` (số nguyên, tự tăng)** làm **cả khoá chính lẫn định danh công khai** trả về API. Client **không gửi `id`** khi tạo; dùng `clientRef` (UUID do client sinh) làm định danh tạm/offline và chống trùng khi retry. Cập nhật `docs/backend-api-spec.md` và `docs/implementation-plan-migrate-supabase-to-api.md`.

### Before
- Mỗi bản ghi có 2 định danh: `id BIGSERIAL` (PK nội bộ, không trả API) + `key UUID` (công khai, trả về JSON dưới tên `id`).
- Frontend `Goal.id` / `Log.id` là `string` (UUID).

### After
- `id BIGSERIAL` là PK **và** định danh công khai (number). Cột `key` bị loại bỏ; DDL/index/validation/ví dụ JSON cập nhật tương ứng.
- `clientRef` (UUID) do client sinh, gửi kèm khi create để idempotent; quan hệ log→goal khi chưa sync dùng `goalClientRef`.
- Frontend `Goal.id` / `Log.id` / `Log.goalId` đổi sang **`number | null`** (`null` khi chưa sync).

### Reason
Đơn giản hoá mô hình định danh còn một khoá số tự tăng duy nhất — dễ truy vấn, dễ đối chiếu với các hệ thống nội bộ khác và không cần sinh UUID phía server.

### Alternatives Considered
1. Giữ `key UUID` công khai song song `id` số — che giấu PK/tránh lộ số lượng bản ghi nhưng phức tạp hơn; người dùng chọn bỏ.
2. Client sinh UUID làm định danh công khai — giữ nguyên logic offline hiện tại, đơn giản nhất; đã cân nhắc nhưng không chọn.

### Assumption / Rủi ro cần theo dõi
- `clientRef` là **khuyến nghị** (chưa được Backend xác nhận) — cần thống nhất để đảm bảo idempotency.
- Rủi ro offline tăng do `id` do server cấp: cần reconcile `clientRef → id` và thứ tự queue goal CREATE trước log CREATE.

---

## 2026-09-12 (cập nhật lần 2)

### Decision
Chốt lại chiến lược định danh: **`key` (UUID) do FRONTEND sinh** là định danh công khai dùng trong mọi API; backend **tự sinh `id` (`BIGSERIAL`, số tự tăng)** làm khoá chính nội bộ và **không trả `id`** ra API. `POST` idempotent theo `key` (key đã tồn tại → trả bản ghi cũ). Cập nhật `docs/backend-api-spec.md` và `docs/implementation-plan-migrate-supabase-to-api.md`.

### Before
- `id BIGSERIAL` là **cả PK lẫn định danh công khai**; client không gửi `id`, phải dùng cột `client_ref` (UUID) để idempotent và cần cơ chế **reconcile** `clientRef → id` (rủi ro cao cho offline).
- API trả `id` (number); `Log.goalId` là number.

### After
- `key UUID` (frontend sinh) là **định danh công khai**; `id BIGSERIAL` chỉ dùng nội bộ (không trả API). Bỏ cột `client_ref` — chính `key` đảm nhiệm idempotency.
- API dùng `key` cho path param và quan hệ (`goalKey` cho log). Create gửi kèm `key`.
- ⇒ **Không cần reconcile ID**; client biết `key` ngay khi tạo offline. Frontend chỉ cần đổi tên `id`→`key`, `goalId`→`goalKey`.

### Reason
Giữ nguyên lợi thế offline-first của kiến trúc hiện tại (client tự sinh định danh), đồng thời đáp ứng yêu cầu backend có PK số tự tăng riêng cho mục đích nội bộ.

### Alternatives Considered
1. Server sinh `id` số làm định danh công khai (phương án trước) — phải reconcile ID khi offline, phức tạp và rủi ro cao; đã bị thay thế.
2. Giữ `client_ref` song song `key` — dư thừa vì `key` đã đảm bảo idempotency; loại bỏ.

### Assumption / Rủi ro cần theo dõi
- Cần Backend xác nhận `POST` idempotent theo `key` (trùng key → trả bản ghi cũ thay vì `409`).
- `key` nên có ràng buộc `UNIQUE`; cần thống nhất unique toàn cục hay theo user.

---

## 2026-09-12 (cập nhật lần 3)

### Decision
Đổi kiểu cột `id` của backend từ `BIGSERIAL` sang **`INT` auto-increment** (`SERIAL` trong PostgreSQL). FK `logs.goal_id` cũng đổi sang `INT` cho khớp `goals.id`. Cập nhật `docs/backend-api-spec.md` và `docs/implementation-plan-migrate-supabase-to-api.md`.

### Before
- `goals.id` / `logs.id`: `BIGSERIAL` (bigint auto-increment); `logs.goal_id`: `BIGINT`.

### After
- `goals.id` / `logs.id`: **`INT` auto-increment** (`SERIAL`); `logs.goal_id`: `INT`.
- Bổ sung ghi chú DDL: `SERIAL` = `INT` + auto-increment; MySQL dùng `INT AUTO_INCREMENT`, SQL Server dùng `INT IDENTITY(1,1)`.
- `user_id` giữ `BIGINT` (tham chiếu bảng `users` của hệ thống auth).

### Reason
`key` (UUID) đã là định danh công khai nên `id` chỉ phục vụ nội bộ; dùng `INT` là đủ và nhẹ hơn `BIGINT`.

### Alternatives Considered
1. Giữ `BIGSERIAL` — dư thừa vì `id` không lộ ra API và không cần dải giá trị lớn; không chọn.
2. Dùng `UUID` làm PK nội bộ — không cần thiết vì `key` đã là UUID; không chọn.

---

## 2026-09-12 (cập nhật lần 4)

### Decision
Đổi tên bảng backend `logs` → **`goal_logs`** để phân biệt với các loại log khác (system/audit/request log). **API resource vẫn giữ `/logs`** nên không ảnh hưởng frontend. Cập nhật `docs/backend-api-spec.md` và `docs/implementation-plan-migrate-supabase-to-api.md`.

### Before
- Bảng: `logs` (generic). DDL/index: `CREATE TABLE logs`, `logs_key_uniq`, `idx_logs_*`.

### After
- Bảng: **`goal_logs`**. DDL/index: `CREATE TABLE goal_logs`, `goal_logs_key_uniq`, `idx_goal_logs_*`.
- ER diagram, §4.2/§4.3, checklist cập nhật; thêm ghi chú tên bảng ở §4.2 và §6.
- API endpoints không đổi (`GET/POST/PUT/DELETE /logs`, `GET /goals/:key/logs`).

### Reason
`logs` là tên quá chung, dễ xung đột/nhầm lẫn với log hệ thống ở backend. `goal_logs` thể hiện rõ miền nghiệp vụ; đổi ở tầng DB nên **không cần sửa frontend**.

### Alternatives Considered
1. Giữ tên `logs` — đơn giản nhưng mơ hồ khi backend có thêm loại log khác; không chọn.
2. Đổi cả API path `/logs` → `/goal-logs` — nhất quán hơn nhưng phá vỡ contract hiện tại và phải sửa `ApiService`; đưa vào mục “Điểm còn bỏ ngỏ” để cân nhắc.

### Assumption / Rủi ro cần theo dõi
- Cần Backend đồng bộ tên bảng `goal_logs` với các bảng log khác trong hệ thống.

---

## 2026-09-12 (cập nhật lần 5)

### Decision
Đổi API prefix của resource log từ `/logs` → **`/goal-logs`** để đồng bộ với tên bảng `goal_logs`. Cập nhật `docs/backend-api-spec.md` và `docs/implementation-plan-migrate-supabase-to-api.md`.

### Before
- Endpoints: `GET /logs`, `POST /logs`, `PUT /logs/:key`, `DELETE /logs/:key`, `GET /goals/:key/logs`.

### After
- Endpoints: `GET /goal-logs`, `POST /goal-logs`, `PUT /goal-logs/:key`, `DELETE /goal-logs/:key`, `GET /goals/:key/goal-logs`.
- Cập nhật tiêu đề/ghi chú §6, checklist, quyết định #7, sequence diagram và task T4.

### Reason
Đồng bộ cách đặt tên giữa tầng CSDL (`goal_logs`) và tầng API, tránh nhầm lẫn với các loại log khác và giúp tài liệu nhất quán.

### Alternatives Considered
1. Giữ path `/logs` trong khi bảng là `goal_logs` — không nhất quán; người dùng chọn đổi để đồng bộ.
2. Đổi thành `/goal-logs` nhưng bỏ endpoint lồng `GET /goals/:key/goal-logs` — giữ lại dưới dạng tuỳ chọn và ghi vào “Điểm còn bỏ ngỏ”.

### Assumption / Rủi ro cần theo dõi
- Frontend `ApiService` phải đổi đồng loạt path sang `/goal-logs` (task T4).

---

## 2026-09-15

### Decision
Triển khai **full migration frontend** sang hợp đồng trong `docs/backend-api-spec.md`: định danh công khai `key` (UUID do client sinh) + `Log.goalKey`, bỏ `userId` ở client; API log dùng prefix `/goal-logs`; DTO gửi đúng field theo spec; chuẩn hoá ngày `YYYY-MM-DD`; sync xử lý goal trước log và bỏ local khi gặp 404.

### Before
- Model: `Goal.id`, `Log.id`, `Log.goalId`, `userId?`; ngày lưu ISO đầy đủ (form dùng `toISOString()`).
- `ApiService`: path `/logs`, gửi **nguyên object** (kèm `syncStatus`, `userId`, timestamp).
- `SyncService`: merge theo `id`, gán `userId`; queue xử lý tuần tự (log có thể chạy trước goal); không xử lý 404.
- Route `/goal/:id`; service `getById`, `getByGoalId`, `getSignalByGoalId`, `deleteByGoalId`; queue field `entityId`.
- `GoalService`/`LogService` dùng constructor injection.

### After
- Model: `Goal.key`, `Log.key`, `Log.goalKey`; bỏ `userId`; ngày `YYYY-MM-DD`.
- `ApiService`: `GET/POST/PUT/DELETE /goal-logs`, path param `key`; payload chỉ gồm field theo spec (`goalPayload`/`logPayload`).
- `SyncService`: merge theo `key`; bỏ `userId`; queue chia 2 lượt (goal trước, log sau); 404 → bỏ local + queue; chỉ đặt `syncStatus='synced'` cho item không còn trong queue.
- Route `/goal/:key`; services `getByKey`, `getByGoalKey`, `getSignalByGoalKey`, `deleteByGoalKey`; thêm `removeLocal`/`removeLocalByGoalKey`; queue field `entityKey`.
- `GoalService`/`LogService` chuyển sang `inject()` (đúng convention).
- `load()` của Goal/Log/Queue bỏ dữ liệu format cũ (thiếu `key`/`goalKey`/`entityKey`).
- Cập nhật `.github/copilot-instructions.md` và `src/app/core/services/.instructions.md`.

### Reason
Đồng bộ frontend với đặc tả backend; đơn giản hoá offline (key do client sinh → không cần reconcile ID) và tránh gửi field thừa/không hợp lệ.

### Alternatives Considered
1. Chỉ đổi prefix `/goal-logs`, giữ field `id`/`goalId` — không khớp spec và phải sửa tiếp; người dùng chọn full migration.
2. Migrate dữ liệu localStorage cũ (`id`→`key`) — phức tạp, kế hoạch đã chốt “bắt đầu mới”; chọn bỏ bản ghi sai format khi load.

### Assumption / Rủi ro cần theo dõi
- Dữ liệu localStorage cũ (trước migration) sẽ bị bỏ khi load — đúng với quyết định “không migrate”.
- Cần backend xác nhận `POST` idempotent theo `key` (mục “Điểm còn bỏ ngỏ” §9 của kế hoạch).
- Chưa kiểm thử E2E với backend thật (T9) vì API sync chưa sẵn sàng.

---

## 2026-09-16

### Decision
Loại bỏ hoàn toàn API snapshot `LogService.getByGoalKey()`; toàn bộ việc đọc logs theo goal chuyển sang `getSignalByGoalKey(goalKey)` (`Signal<Log[]>`). Chỗ dùng cuối cùng trong `GoalFormComponent.validateEdit()` được đổi sang `getSignalByGoalKey(editing.key)()`.

### Before
- `LogService.getByGoalKey(goalKey: string): Log[]` — đọc `_logs()` rồi `filter()` một lần, không reactive (`@deprecated`).
- `goal-form.component.ts`: `const logs = this.logService.getByGoalKey(editing.key);`
- Tài liệu (`.github/copilot-instructions.md`, `src/app/core/services/.instructions.md`) còn liệt kê `getByGoalKey`.

### After
- `LogService` chỉ còn `logs`, `logsMap`, `getSignalByGoalKey()` và các hàm mutate (`create`/`update`/`delete`/`setAll`/`removeLocal*`).
- `goal-form.component.ts`: `const logs = this.logService.getSignalByGoalKey(editing.key)();`
- Tài liệu chỉ hướng dẫn `getSignalByGoalKey(goalKey)` → `Signal<Log[]>`, ghi rõ cách đọc giá trị bằng `()` và không thêm lại hàm snapshot.

### Reason
- Trước đây tồn tại 2 API song song cùng chức năng, dễ dùng nhầm bản không reactive (dashboard/goal-detail/goal-card đã dùng signal → không thống nhất).
- `validateEdit()` là ngữ cảnh imperative (gọi trong `submit()` sau validate form, có `confirm()`), không phải reactive context; đọc ngay giá trị signal `()` là cách đúng để lấy logs mới nhất mà không cần snapshot API riêng.
- Output của `getSignalByGoalKey()` là computed nên việc gọi trong `submit()` là one-off, chi phí không đáng kể.

### Alternatives Considered
1. Giữ `getByGoalKey()` với `@deprecated` — người dùng chọn xoá hẳn để tránh code chết và tránh bị dùng lại nhầm.
2. Khai báo `computed` trong `GoalFormComponent` cho logs của goal đang sửa — phức tạp hơn do goal đang sửa do `@Input() initialGoal` quyết định và chỉ cần đọc 1 lần khi submit.
3. Đổi `validateEdit()` sang async/effect — không cần thiết, làm phức tạp luồng submit đồng bộ.

### Assumption / Rủi ro cần theo dõi
- Giả định: không có code nào ngoài repo gọi `getByGoalKey()` (đã kiểm tra toàn workspace: chỉ còn trong tài liệu).
- `getSignalByGoalKey()` tạo `computed` mới mỗi lần gọi; nếu về sau có nơi gọi trong template/vòng lặp thì nên cache signal theo `goalKey`.
- `logsMap`/`getSignalByGoalKey()` dùng `.sort()` trên mảng mới (`[...existing, log]`) nên không mutate state gốc — cần giữ nguyên đặc tính này nếu refactor.
