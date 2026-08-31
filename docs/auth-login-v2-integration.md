# Tích hợp login OAuth V2 — Tài liệu cho Webapp

> Hướng dẫn cho các **webapp** muốn tích hợp tính năng đăng nhập bằng API của hệ thống (login qua Google / GitHub / Zalo).
> Base URL API: `https://api.thanhdc.dev` (thay bằng domain thực tế). Ngày cập nhật: 2026-08-31.

---

## 1. Tổng quan flow

OAuth client (clientId/clientSecret/redirectUri theo app) do **BackEnd đăng ký/cấu hình thủ công** — webapp không cần thực hiện. Webapp chỉ cần biết `appKey` + `providerKey` để gọi API. Luồng chung:

1. Webapp gọi API lấy `authUrl` rồi đưa browser của user tới đó.
2. User xác thực tại provider (Google/GitHub/Zalo).
3. Provider redirect browser về **redirectUri của webapp** kèm `code` + `state`.
4. Webapp gọi API `GET /auth/callback` để đổi `code` lấy `accessToken` + `refreshToken` (user tự động được tạo/link nếu chưa có).
5. Webapp dùng token để gọi các API có bảo vệ (`Authorization: Bearer <accessToken>`).

---

## 2. Điều kiện tiên quyết

Webapp cần biết 2 giá trị sau (do BackEnd cấp / đã thống nhất):

| Giá trị | Mô tả | Ví dụ |
|---|---|---|
| `appKey` | Mã định danh webapp (dùng chung cho mọi provider) | `webA` |
| `providerKey` | Provider đăng nhập | `google` \| `github` \| `zalo` |

> **Lưu ý:** `clientId`/`clientSecret`/`redirectUri`/`scopes` do **BackEnd đăng ký và quản lý** — webapp không cần và không được phép tự đăng ký.

---

## 3. Bước 1 — Lấy URL đăng nhập

**Endpoint:** `GET /auth/:provider/login-url?app=<appKey>` → `200`

**Response:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

**Curl:**
```bash
curl "https://api.thanhdc.dev/auth/google/login-url?app=webA"
```

**JavaScript (fetch):**
```js
const res = await fetch(
  "https://api.thanhdc.dev/auth/google/login-url?app=webA"
);
const { authUrl } = await res.json();
window.location.href = authUrl; // đưa user tới trang xác thực
```

> `redirectUri` dùng để build `authUrl` chính là giá trị đã cấu hình ở BackEnd — webapp **không cần** truyền lại.

---

## 4. Bước 2 — Xử lý callback (đổi code lấy token)

Sau khi user xác thực, provider redirect browser về `redirectUri` của webapp với query `code` + `state`. Webapp gọi API dưới đây để đổi `code` lấy token. Nên gọi từ **phía server webapp** nếu có thể.

**Endpoint:** `GET /auth/callback?code=...&state=...` → `200`

**Response:**
```json
{
  "user": {
    "id": 123,
    "fullname": "Nguyen Van A",
    "email": "a@example.com",
    "picture": "https://..."
  },
  "tokens": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```

**Curl:**
```bash
curl "https://api.thanhdc.dev/auth/callback?code=4/0Axxxx&state=eyJhbGciOi..."
```

**JavaScript (fetch):**
```js
// chạy ở server hoặc client — lấy code + state từ URL hiện tại
const params = new URLSearchParams(window.location.search);
const res = await fetch(
  `https://api.thanhdc.dev/auth/callback?code=${params.get("code")}&state=${params.get("state")}`
);
const data = await res.json();
const { user, tokens } = data;
// lưu tokens (ví dụ: httpOnly cookie hoặc localStorage tuỳ chính sách bảo mật)
```

> **Lưu ý:**
> - `state` do hệ thống phát hành (token đã ký, chứa `appKey` + `providerKey`, hết hạn sau **100 phút**) — provider không còn nằm trong URL.
> - User **tự động được tạo** nếu chưa có tài khoản — webapp không cần bước đăng ký riêng cho OAuth.
> - `state` thiếu/sai/hết hạn → `400 ERR_STATE_INVALID_OR_EXPIRED`.

---

## 5. Sử dụng token & vòng đời

### 6.1. Gọi API có bảo vệ

Gắn token vào header mọi request:

```http
Authorization: Bearer <accessToken>
```

### 6.2. Lấy thông tin user hiện tại

**Endpoint:** `GET /auth/me` → `200`

**Response:**
```json
{
  "id": 123,
  "fullname": "Nguyen Van A",
  "email": "a@example.com"
}
```

**Curl:**
```bash
curl "https://api.thanhdc.dev/auth/me" \
  -H "Authorization: Bearer <accessToken>"
```

### 6.3. Refresh token (khi accessToken hết hạn)

**Endpoint:** `POST /auth/refresh` → `200`

**Body:**
```json
{
  "refreshToken": "eyJhbGciOi..."
}
```

**Response:** cặp token **mới** (refresh token được rotate — lưu token mới để dùng lần sau):

```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi..."
}
```

**Curl:**
```bash
curl -X POST "https://api.thanhdc.dev/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{ "refreshToken": "eyJhbGciOi..." }'
```

**JavaScript (fetch):**
```js
async function refreshTokens(refreshToken) {
  const res = await fetch("https://api.thanhdc.dev/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  return res.json(); // { accessToken, refreshToken }
}
```

> **Lưu ý:** refresh token hết hạn hoặc đã bị thu hồi → `401 UNAUTHORIZED`. Khi đó bắt buộc đưa user quay lại flow đăng nhập.

### 6.4. Đăng xuất

**Endpoint:** `DELETE /auth/logout` → `204 No Content` (token bị blacklist, không dùng được nữa)

**Curl:**
```bash
curl -X DELETE "https://api.thanhdc.dev/auth/logout" \
  -H "Authorization: Bearer <accessToken>"
```

**JavaScript (fetch):**
```js
await fetch("https://api.thanhdc.dev/auth/logout", {
  method: "DELETE",
  headers: { Authorization: `Bearer ${accessToken}` },
});
// xoá tokens khỏi client sau khi logout thành công
```

---

## 6. Xử lý lỗi

### 7.1. Format lỗi chuẩn

Mọi lỗi đều trả về JSON thống nhất (khác HTTP status):

```json
{
  "timestamp": "2026-08-31T10:00:00.000Z",
  "method": "GET",
  "path": "/auth/callback",
  "statusCode": 400,
  "code": "ERR_STATE_INVALID_OR_EXPIRED",
  "error": null
}
```

### 7.2. Các mã lỗi liên quan flow login

| HTTP | `code` | Ý nghĩa & cách xử lý |
|---|---|---|
| `400` | `VALIDATION_FAIL` | Thiếu/sai tham số (vd: thiếu `app` ở login-url). Kiểm tra lại query. |
| `400` | `ERR_STATE_INVALID_OR_EXPIRED` | `state` sai/hết hạn. Đưa user quay lại Bước 1 để lấy login-url mới. |
| `401` | `UNAUTHORIZED` | Token thiếu/sai/hết hạn/đã logout. Refresh token nếu có, ngược lại redirect về login. |
| `404` | *(NotFoundException)* | OAuth client chưa được cấu hình cho `appKey`+`providerKey`. Liên hệ BackEnd kiểm tra cấu hình. |
| `429` | `TOO_MANY_REQUESTS` | Quá nhiều request. Retry sau khi hết thời gian chờ. |

> **Gợi ý xử lý chung ở webapp:** gặp `401` → thử refresh 1 lần; refresh fail → xoá token, redirect về màn hình đăng nhập.

---

## 7. Checklist trước khi go-live

- [ ] Đã có `appKey` + `providerKey` do BackEnd cấp, và OAuth client đã được BackEnd đăng ký đủ các provider webapp dùng.
- [ ] Callback của webapp trỏ đúng `redirectUri` đã cấu hình ở BackEnd (HTTPS, kể cả path) và forward đúng `code` + `state` tới `GET /auth/callback`.
- [ ] Webapp gọi `login-url` có kèm `?app=<appKey>`.
- [ ] Đã kiểm thử vòng đời token: login → `me` → `refresh` → `logout`.
- [ ] Đã xử lý trường hợp `state` hết hạn (user bấm link cũ) và `401` khi token hết hạn.
