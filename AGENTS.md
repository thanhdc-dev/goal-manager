# AGENTS — Nguyên tắc Phát triển & Tài liệu hóa Quyết định

## Nguyên tắc chung

- Agent chịu trách nhiệm **vừa triển khai vừa ghi tài liệu** dự án.
- Mục tiêu: luôn ghi lại các quyết định triển khai thành tài liệu tại `docs/implementation-notes.md`.
- Không bao giờ **âm thầm** đưa ra quyết định kiến trúc — mọi quyết định phải để lại dấu vết kiểm toán (audit trail).

## Quy trình bắt buộc khi nhận yêu cầu

Khi nhận bất kỳ yêu cầu phát triển nào, **bắt buộc** thực hiện tuần tự các bước sau:

### 1. Phân tích yêu cầu
Trước khi viết bất kỳ mã nguồn nào, phải xác định rõ:
- **Mục tiêu** của yêu cầu là gì.
- **File/module bị ảnh hưởng** (dự kiến sẽ đọc/sửa/tạo).
- **Điểm chưa rõ** — những chi tiết thiếu hoặc mơ hồ cần làm rõ trước khi triển khai.

### 2. Đặt câu hỏi làm rõ (dạng select option)
- Câu hỏi phải trình bày dưới dạng **multiple choice / multi-select**.
- Mỗi câu hỏi có **tiêu đề ngắn gọn** và **phương án mặc định** được đề xuất.
- Không triển khai khi còn điểm chưa rõ thuộc mục 3 bên dưới.

### 3. Nội dung tối thiểu cần làm rõ
Phải làm rõ tối thiểu các nội dung sau trước khi triển khai:
- **Phạm vi** (scope): làm gì, không làm gì.
- **Task breakdown**: chia nhỏ công việc thành các bước cụ thể.
- **Ràng buộc kỹ thuật**: công nghệ, thư viện, convention, giới hạn bắt buộc tuân theo.
- **Tiêu chí hoàn thành** (definition of done): thế nào là xong.
- **Quyết định bỏ ngỏ**: những lựa chọn chưa được người dùng chỉ định rõ.

### 4. Chỉ triển khai sau khi xác nhận
- **Chỉ triển khai sau khi người dùng xác nhận** các câu trả lời làm rõ.
- Nếu vì lý do nào đó phải **tự đưa ra giả định**, giả định đó **bắt buộc phải ghi vào** `docs/implementation-notes.md`.

## Workflow khi phát triển

Mỗi lần thực hiện công việc phát triển, làm theo 3 bước:

### 1. Triển khai
Thực hiện thay đổi được yêu cầu.

### 2. Xác định & Xác nhận
- **Xác định** bất kỳ quyết định nào chưa được chỉ định rõ ràng
- **Đặt câu hỏi để người dùng xác nhận** trước khi bắt đầu thực hiện

### 3. Ghi tài liệu
- **Ghi lại** quyết định đó vào `docs/implementation-notes.md`
- Sử dụng định dạng chuẩn (xem bên dưới)

## Khi nào BẮT BUỘC ghi tài liệu

Ghi tài liệu trong các trường hợp sau:

- ✅ Quyết định kỹ thuật được đưa ra
- ✅ Thư viện được lựa chọn
- ✅ Hạn chế của framework yêu cầu một giải pháp thay thế (workaround)
- ✅ Cách triển khai khác với đặc tả kỹ thuật (specification)
- ✅ Một sự đánh đổi (trade-off) được chấp nhận
- ✅ Một giả định được đưa vào
- ✅ Sửa lỗi (bug fix) yêu cầu thay đổi kiến trúc
- ✅ Mã nguồn hiện tại buộc phải sử dụng một hướng tiếp cận khác

## Định dạng tài liệu

Bổ sung các mục vào `docs/implementation-notes.md` theo định dạng chuẩn:

```markdown
## YYYY-MM-DD

### Decision
Mô tả quyết định.

### Before
Mã nguồn trông như thế nào trước thay đổi.

### After
Mã nguồn trông như thế nào sau thay đổi.

### Reason
Tại sao quyết định này lại được đưa ra.

### Alternatives Considered
Các phương án khác đã được xem xét và đánh giá.
```

## Checklist trước khi hoàn tất

Luôn kiểm tra và xác nhận:

- [ ] `docs/implementation-notes.md` đã được cập nhật chưa?
- [ ] Nếu chưa cập nhật, phải giải thích rõ tại sao không cần thay đổi tài liệu
- [ ] Không bao giờ âm thầm đưa ra các quyết định kiến trúc
- [ ] Luôn để lại dấu vết kiểm toán (audit trail)

---

## Tài liệu liên quan

- [Implementation Notes](./docs/implementation-notes.md) — Ghi chép chi tiết các quyết định triển khai
- [Goal Manager Specs](./docs/goal-manager-specs.md) — Đặc tả chi tiết yêu cầu
- [Copilot Instructions](./.github/copilot-instructions.md) — Hướng dẫn công nghệ stack
