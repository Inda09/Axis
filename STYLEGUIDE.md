# Axis UI Styleguide

## Design Tokens

Defined in `src/styles/tokens.css` and loaded globally via `src/app/globals.css`.

### Surfaces
- `--bg-0`, `--bg-1`, `--bg-2`: primary background layers
- `--glass`, `--glass-2`: glassmorphism surfaces
- `--border`, `--border-2`: neutral + accent borders
- `--shadow-0`, `--shadow-1`: glass shadows
- `--glow`: accent glow

### Text
- `--text-0`: primary text
- `--text-1`: secondary text
- `--text-2`: muted text

### Accent
- `--acc-0`, `--acc-1`: electric green accents

### Radius
- `--r-lg`, `--r-md`, `--r-sm`

## Components (UI Library)

Located in `src/components/ui/`.

- `GlassCard`: glass surface with blur, border, and soft shadow.
- `PrimaryButton`: dark surface, green edge, hover glow.
- `SecondaryButton`: glass surface with border.
- `IconButton`: circular glass button with glow hover.
- `ModeToggle`: glass pill with motion slider.
- `BottomNav`: mobile glass bar with animated active indicator.
- `Toasts`: bottom nudges with progress bar.

## Motion Rules

- Page transitions: opacity 0 → 1, y 10 → 0, blur 6px → 0.
- Exit: opacity 0, y 6, blur 6px.
- Stagger: `staggerChildren: 0.05`; children animate y 8 → 0.
- Buttons: press scale 0.98.
- Mode toggle: layoutId slider with spring.
- Timer halo pulse: 2.4s easeInOut scale 1 → 1.02 → 1.
- Respect `prefers-reduced-motion` across all motion.
