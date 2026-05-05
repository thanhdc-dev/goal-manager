---
name: Naming Conventions
globs: src/**/*.{ts,js}
alwaysApply: true

---

# Naming Conventions Rules

## Quy ước đặt tên biến (Variable Naming)
- **Camel Case**: Đặt tên biến phải theo quy định Camel Case
- **Ví dụ**: `userList`, `isLoading`

## Quy ước đặt tên Class
- **Pascal Case**: Đặt tên class phải theo quy định Pascal Case
- **Ví dụ**: `UserService`, `AppComponent`

## Quy ước đặt tên Interface
- **Tiền tố I**: Luôn bắt đầu bằng ký tự 'I'
- **Pascal Case**: Phần còn lại theo Pascal Case
- **Ví dụ**: `IExample`, `IUserService`, `IDataSource`

## Quy ước đặt tên Thư mục (Folder/Directory)
- **Kebab Case**: Đặt tên thư mục phải theo quy định Kebab case
- **Ví dụ**: `user-service`, `data-source`

## Quy ước đặt tên Component Selector
- **Kebab Case**: Selector của component phải theo Kebab case
- **Ví dụ**: `<user-list>`, `<data-table>`

## Quy ước đặt tên File
- **Kebab Case**: Tên file phải theo quy định Kebab case
- **Ví dụ**: `user.service.ts`, `app.module.ts`

## Quy ước đặt tên Model, DTO, RO
- **Hậu tố**: Luôn kèm chuỗi 'Model', 'DTO', hoặc 'RO' vào cuối tên
- **Pascal Case**: Phần tên chính theo Pascal Case
- **Ví dụ**: 
  - Model: `ExampleModel`, `UserModel`, `ProductModel`
  - DTO: `ExampleDTO`, `CreateUserDTO`, `UpdateProductDTO`
  - RO: `ExampleRO`, `UserResponseRO`, `ProductResultRO`

## Quy ước đặt tên Hàm (Function Naming)
- **Camel Case**: Đặt tên hàm phải theo quy định Camel Case
- **Hành động + Danh từ**: Nên bắt đầu bằng động từ mô tả hành động
- **Ví dụ**: `getUserList`, `saveData`, `validateInput`

---

## Tổng kết nhanh

| Đối tượng | Quy định | Ví dụ |
|-----------|----------|-------|
| Biến | Camel Case | `userList` |
| Class | Pascal Case | `UserService` |
| Interface | I + Pascal Case | `IUserService` |
| Thư mục | Kebab Case | `user-service` |
| Component Selector | Kebab Case | `user-list` |
| File | Kebab Case | `user.service.ts` |
| Model | Pascal + Model | `UserModel` |
| DTO | Pascal + DTO | `CreateUserDTO` |
| RO | Pascal + RO | `CreateUserRO` |
| Hàm | Camel Case | `getUserList` |
