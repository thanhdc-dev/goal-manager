# Goal Manager – Copilot Instructions

## Tech Stack
- **Angular 21** — standalone components only, NO NgModules
- **Signals** — dùng `signal()`, `computed()`, `inject()` từ `@angular/core`
- **Routing** — lazy loading qua `loadComponent` trong `app.routes.ts`
- **Storage** — localStorage only, không có backend
- **CSS** — SCSS
- **Charts** — chart.js (đã cài sẵn)

## Cấu trúc thư mục

```
src/app/
  core/services/        # Injectable services (GoalService, LogService, CalculationService)
  shared/models/        # Interfaces & types (Goal, Log, GoalStats)
  pages/                # Routed page components (lazy loaded)
  components/           # Reusable "dumb" components (nhận @Input, emit @Output)
  app.routes.ts         # Tất cả routes khai báo ở đây
  app.config.ts         # ApplicationConfig
```

## Domain Models

```ts
// Goal — mục tiêu
interface Goal {
  id: string;
  name: string;
  targetValue: number;
  unit: string;
  valueType: 'integer' | 'decimal';
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
  accumulationType: 'daily' | 'monthly';
  description?: string;
  createdAt: string;  // ISO string
}

// Log — lần ghi nhận tiến độ
interface Log {
  id: string;
  goalId: string;
  value: number;
  date: string;   // YYYY-MM-DD
  note?: string;
  createdAt: string;
}

// ProgressStatus
type ProgressStatus = 'ahead' | 'on-track' | 'behind' | 'completed' | 'expired';
```

## Services quan trọng

### GoalService (`core/services/goal.service.ts`)
- `goals` — readonly signal chứa toàn bộ danh sách
- `activeGoals` — computed signal, lọc goal chưa hết hạn
- `getById(id)` → `Goal | undefined`
- `create(data)` → `Goal`
- `update(id, data)` → `void`
- `delete(id)` → `void`
- Tự động sync với localStorage key `gm_goals`

### LogService (`core/services/log.service.ts`)
- `logs` — readonly signal chứa toàn bộ logs
- `getByGoalId(goalId)` → `Log[]`
- `create(data)` → `Log`
- `update(id, data)` → `void`
- `delete(id)` → `void`
- Tự động sync với localStorage key `gm_logs`

### CalculationService (`core/services/calculation.service.ts`)
- `computeStats(goal, logs)` → `GoalStats` — **KHÔNG tính toán trực tiếp trong component**
- `getPredictionMessage(goal, stats)` → `string` — trả về chuỗi insight tiếng Việt
- Có cache nội bộ để tránh tính lại khi logs không đổi

### GoalStats (kết quả từ CalculationService)
```ts
interface GoalStats {
  currentValue: number;
  progress: number;         // 0–100 (%)
  remaining: number;
  remainingPeriods: number; // ngày hoặc tháng tùy accumulationType
  totalPeriods: number;
  requiredPerPeriod: number;
  expectedProgress: number; // 0–100 (%)
  expectedValue: number;    // giá trị kỳ vọng cần đạt tại thời điểm hiện tại
  status: ProgressStatus;
  predictedTotal: number;
  avgPerPeriod: number;
  streak: number;           // số kỳ liên tiếp có log
  milestones: MilestoneStatus[]; // 25%, 50%, 75%, 100%
  isExpired: boolean;
}
```

## Conventions bắt buộc

- **Injection**: luôn dùng `inject()` function, KHÔNG dùng constructor injection
- **Standalone**: mọi component đều `standalone: true`
- **Selector**: `app-*` (ví dụ: `app-goal-card`, `app-log-form`)
- **Date**: mọi date lưu dạng string ISO, KHÔNG dùng `new Date()` trong model
- **Tính toán**: KHÔNG tính toán trong component, luôn gọi `CalculationService.computeStats()`
- **ID**: dùng `crypto.randomUUID()` để tạo id mới
- **Signals**: dùng `signal()` cho state, `computed()` cho derived state

## Ví dụ component chuẩn

```ts
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.scss']
})
export class ExampleComponent {
  private goalService = inject(GoalService);
  private logService = inject(LogService);
  private calcService = inject(CalculationService);

  goals = this.goalService.goals; // signal

  getStats(goal: Goal): GoalStats {
    const logs = this.logService.getByGoalId(goal.id);
    return this.calcService.computeStats(goal, logs);
  }
}
```

## Routes hiện tại
- `/` → `DashboardComponent` — danh sách goals, tạo/sửa/xóa goal
- `/goal/:id` → `GoalDetailComponent` — chi tiết goal, quản lý logs
