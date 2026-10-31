# Student Money Tracker — Design System

> **Style**: Business Minimalist  
> **Base Palette**: Warm Off-White / Obsidian / Forest Olive / Crimson  
> **Framework**: Next.js 16 + Tailwind CSS v4 + Lucide Icons + Recharts  
> **Tokens**: [`design-tokens.json`](./design-tokens.json)

---

## 1. Aesthetic Rationale & Philosophy

The **Student Money Tracker** balances professional SaaS clarity with a warm, editorial student aesthetic.
Instead of harsh clinical stark-white (`#FFFFFF`) or juvenile high-saturation neons, the interface employs:
- **Warm Canvas**: `#FAF9F6` in light mode and `#121212` in dark mode.
- **Editorial Contrast**: Deep Obsidian `#18181B` for actions, Forest Olive `#2E6F40` for income/positive cashflow, and Crimson `#9E2A2B` for expenditures/debts.
- **Micro-Textures**: 1px subtle borders (`#EAE8E3` / `#2D2D2D`) instead of drop shadows or heavy gradient fills.

---

## 2. Color Palette & Token Architecture

Defined via Tailwind CSS v4 `@theme` in `src/app/globals.css`:

| Semantic Token | Light Mode | Dark Mode | Intended Usage |
| :--- | :--- | :--- | :--- |
| `--color-canvas` | `#FAF9F6` | `#121212` | Root page background |
| `--color-surface` | `#FFFFFF` | `#1E1E1E` | Card, container, and modal backgrounds |
| `--color-border-subtle` | `#EAE8E3` | `#2D2D2D` | Structural 1px separation lines |
| `--color-fg-primary` | `#1A1A1A` | `#F4F4F5` | Headings, primary numeric balances |
| `--color-fg-muted` | `#706E6B` | `#A1A1AA` | Captions, dates, secondary labels |
| `--color-brand-accent` | `#18181B` | `#F4F4F5` | Primary call-to-action buttons |
| `--color-positive` | `#2E6F40` | `#4ADE80` | Income, receivables, settle confirmation |
| `--color-negative` | `#9E2A2B` | `#F87171` | Expenses, payables, destructive actions |

---

## 3. Typography System

- **Global Font**: `Inter` via Google Fonts, falling back to `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.
- **Numbers**: Always rendered with `tabular-nums` so columns and currency figures align vertically.
- **Micro-labels**: `text-xs font-semibold uppercase tracking-wider` for section headers and metric chips.
- **Headings**: `font-semibold tracking-tight` (H1: `text-2xl md:text-3xl`, Card Title: `text-xl`, Section: `text-lg`).
- **Body & Inputs**: `text-sm font-normal` with 1.5 line height.

---

## 4. Component Patterns

### Modals & Dialogs
- **Shell**: `fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4`
- **Surface**: `w-full max-w-md bg-white dark:bg-[#1E1E1E] border border-[#EAE8E3] dark:border-[#2D2D2D] rounded-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150`
- **Close Button**: Accessible 44×44px button with `aria-label="Close dialog"` and `focus-visible:ring-2`.

### Segmented Controls & Pills
- **Container**: `p-1 rounded-xl bg-[#FAF9F6] dark:bg-[#121212] border border-[#EAE8E3] dark:border-[#2D2D2D]`
- **Active Tab**: `bg-white dark:bg-[#1E1E1E] shadow-xs font-bold text-fg-primary`
- **Inactive Tab**: `text-fg-muted hover:text-fg-primary font-semibold text-xs`

### Inputs
- **Underline Style**: `w-full pl-7 pr-2 py-3 text-sm font-normal bg-transparent border-b border-[#EAE8E3] dark:border-[#2D2D2D] focus:border-[#18181B] dark:focus:border-[#F4F4F5] focus:outline-hidden min-h-[44px]`

### Recharts Data Visualization
- **Light Mode**: High-contrast Obsidian `#18181B` trendlines with muted axes.
- **Dark Mode**: Dynamic `#F4F4F5` lines with `#2D2D2D` gridlines and dark-adapted pie chart palettes.

---

## 5. Accessibility & Touch Targets

- Every interactive button and input satisfies WCAG AA touch targets (`min-h-[44px]` and `min-w-[44px]`).
- Icon-only buttons (`X`, `Trash2`, `ThemeToggle`) feature explicit `aria-label` attributes for screen readers.
- Focus rings use `focus-visible:ring-2 focus-visible:outline-hidden` to avoid mouse outline clutter while keeping keyboard navigation clear.
