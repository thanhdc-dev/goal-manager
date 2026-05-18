---
name: 8-Point Grid System
globs: src/**/*.{html,ts,scss},tailwind.config.*
alwaysApply: true
---

# UI Rule: 8-Point Grid System

## Core Principle
ALL spacing, sizing, typography, border-radius, and shadow values MUST be multiples of 8px (or 4px for fine-grained adjustments). This project uses Tailwind CSS — enforce via Tailwind utility classes that map to the 8pt grid.

---

## Allowed Spacing Values (margin / padding)

Use ONLY these Tailwind spacing classes:

| Tailwind Class | px value | Use case |
|---|---|---|
| `p-0` / `m-0` | 0px | Reset |
| `p-1` / `m-1` | 4px | Micro gap (exception — 4pt half-grid) |
| `p-2` / `m-2` | 8px | Tight spacing |
| `p-3` / `m-3` | 12px | Fine-grained (half-grid) |
| `p-4` / `m-4` | 16px | Default component padding |
| `p-6` / `m-6` | 24px | Section inner spacing |
| `p-8` / `m-8` | 32px | Card / container padding |
| `p-10` / `m-10` | 40px | Large section gap |
| `p-12` / `m-12` | 48px | Spacious layout gap |
| `p-16` / `m-16` | 64px | Hero / page section |
| `p-20` / `m-20` | 80px | XL section spacing |
| `p-24` / `m-24` | 96px | Max section padding |

**FORBIDDEN spacing values:** `p-5` (20px), `p-7` (28px), `p-9` (36px), `p-11` (44px), or any arbitrary value like `p-[13px]`, `m-[22px]`.

> Exception: `p-1` (4px) and `p-3` (12px) are allowed as half-grid values for fine details only.

---

## Allowed Sizing Values (width / height)

All `w-*`, `h-*`, `min-w-*`, `max-w-*`, `min-h-*`, `max-h-*` must map to multiples of 8:

- Use Tailwind scale: `w-8`(32px), `w-10`(40px), `w-12`(48px), `w-16`(64px), `w-20`(80px), `w-24`(96px), `w-32`(128px), `w-40`(160px), `w-48`(192px), `w-64`(256px), `w-80`(320px), `w-96`(384px)
- For fixed pixel widths use multiples of 8: `w-[48px]` ✅ — `w-[50px]` ❌
- For percentage / viewport sizes (`w-full`, `w-screen`, `w-1/2`): allowed freely.
- Icon sizes: use `w-4 h-4` (16px), `w-5 h-5` (20px — half-grid ok for icons), `w-6 h-6` (24px), `w-8 h-8` (32px).

---

## Allowed Typography Values (font-size / line-height)

Use ONLY standard Tailwind text classes — do NOT use arbitrary `text-[13px]` or `leading-[17px]`:

| Class | font-size | line-height |
|---|---|---|
| `text-xs` | 12px | 16px |
| `text-sm` | 14px | 20px |
| `text-base` | 16px | 24px |
| `text-lg` | 18px | 28px |
| `text-xl` | 20px | 28px |
| `text-2xl` | 24px | 32px |
| `text-3xl` | 30px | 36px |
| `text-4xl` | 36px | 40px |
| `text-5xl` | 48px | 48px |
| `text-6xl` | 60px | 60px |

**line-height classes:** use `leading-4`(16px), `leading-5`(20px), `leading-6`(24px), `leading-7`(28px), `leading-8`(32px), `leading-9`(36px), `leading-10`(40px).

---

## Allowed Border Radius Values

| Tailwind Class | px value |
|---|---|
| `rounded-none` | 0px |
| `rounded-sm` | 2px (fine detail only) |
| `rounded` | 4px |
| `rounded-md` | 6px |
| `rounded-lg` | 8px |
| `rounded-xl` | 12px |
| `rounded-2xl` | 16px |
| `rounded-3xl` | 24px |
| `rounded-full` | 9999px (pills/avatars) |

**FORBIDDEN:** arbitrary values like `rounded-[5px]`, `rounded-[10px]`, `rounded-[15px]`.

---

## Allowed Shadow Values

Use standard Tailwind shadow scale only:

- `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`, `shadow-none`
- Custom shadows in `tailwind.config` MUST use offsets and blur values in multiples of 4px or 8px.

**FORBIDDEN:** arbitrary `shadow-[0_3px_7px_...]`.

---

## Enforcement Rules for AI Assistants / Developers

1. **Before writing any Tailwind class for spacing/sizing/typography/radius/shadow**, verify it aligns to the 8pt grid (or 4pt half-grid where noted).
2. **When editing existing components**, if you encounter a non-grid value (e.g., `p-5`, `m-7`, `text-[15px]`), flag it and replace with the nearest valid grid value.
3. **Never introduce arbitrary CSS values** (`[value]` syntax) unless the value is a proven multiple of 4 or 8.
4. **When generating new Angular components** (`.html` templates), default spacing is:
   - Container padding: `p-4` (16px) or `p-8` (32px)
   - Between sibling elements: `gap-4` (16px) or `gap-8` (32px)
   - Button padding: `px-4 py-2` (16px / 8px)
5. **For responsive utilities** (`sm:`, `md:`, `lg:`), the same grid rules apply — e.g., `md:p-8` ✅, `md:p-5` ❌.
6. **In SCSS files**: if writing custom CSS (not Tailwind), use `rem` or `px` values that are multiples of 0.25rem (4px). Example: `padding: 1rem` ✅ — `padding: 0.9375rem` ❌.

---

## Quick Reference — Common Patterns

```html
<!-- Card component -->
<div class="p-8 rounded-xl shadow-md">...</div>

<!-- Button -->
<button class="px-4 py-2 rounded-lg text-sm leading-5">Click</button>

<!-- Page section -->
<section class="py-16 px-8">...</section>

<!-- Form field gap -->
<div class="flex flex-col gap-4">...</div>

<!-- Avatar / icon -->
<img class="w-8 h-8 rounded-full" />
```

---

## Reference

- 8-Point Grid System: https://spec.fm/specifics/8-pt-grid
- Tailwind spacing scale: https://tailwindcss.com/docs/customizing-spacing
