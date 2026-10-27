---
name: PrepPulse Design System
colors:
  surface: '#fbf9f0'
  surface-dim: '#dcdad1'
  surface-bright: '#fbf9f0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f4eb'
  surface-container: '#f0eee5'
  surface-container-high: '#eae8df'
  surface-container-highest: '#e4e3da'
  on-surface: '#1b1c17'
  on-surface-variant: '#454742'
  inverse-surface: '#30312b'
  inverse-on-surface: '#f3f1e8'
  outline: '#767871'
  outline-variant: '#c6c7c0'
  surface-tint: '#5d5f5a'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1a1c18'
  on-primary-container: '#83847e'
  inverse-primary: '#c6c7c0'
  secondary: '#4b6700'
  on-secondary: '#ffffff'
  secondary-container: '#c6f26a'
  on-secondary-container: '#506e00'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#181d15'
  on-tertiary-container: '#80867b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e3e3dc'
  primary-fixed-dim: '#c6c7c0'
  on-primary-fixed: '#1a1c18'
  on-primary-fixed-variant: '#464742'
  secondary-fixed: '#c6f26a'
  secondary-fixed-dim: '#abd551'
  on-secondary-fixed: '#141f00'
  on-secondary-fixed-variant: '#374e00'
  tertiary-fixed: '#dfe4d8'
  tertiary-fixed-dim: '#c3c8bc'
  on-tertiary-fixed: '#181d15'
  on-tertiary-fixed-variant: '#43483f'
  background: '#fbf9f0'
  on-background: '#1b1c17'
  surface-variant: '#e4e3da'
typography:
  display-hero:
    fontFamily: Manrope
    fontSize: 3.5rem
    fontWeight: '700'
    lineHeight: 3.75rem
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Manrope
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Manrope
    fontSize: 2.5rem
    fontWeight: '600'
    lineHeight: 2.75rem
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Manrope
    fontSize: 1.875rem
    fontWeight: '600'
    lineHeight: 2.125rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.125rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Manrope
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.625rem
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Manrope
    fontSize: 1rem
    fontWeight: '600'
    lineHeight: 1.375rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  body-md:
    fontFamily: Geist
    fontSize: 0.9375rem
    fontWeight: '400'
    lineHeight: 1.5rem
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Geist
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.25rem
    letterSpacing: 0em
  caption:
    fontFamily: Geist
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.01em
  metric-display:
    fontFamily: JetBrains Mono
    fontSize: 2.25rem
    fontWeight: '500'
    lineHeight: 2.5rem
    letterSpacing: -0.03em
  metric-badge:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: -0.01em
  code-inline:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.125rem
    letterSpacing: 0em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  gutter-lg: 2rem
  margin: 2rem
  margin-mobile: 1rem
  margin-desktop: 3rem
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  space-3xl: 4.5rem
---

## Brand & Style

This design system embodies the calculated calm of an elite athletic training suite combined with the editorial discipline of a high-end publication. It rejects AI software clichés—such as nebulous violet gradients, decorative particle glows, and soft neuromorphic bubbles—in favor of structural authority, architectural typography, and deliberate data display.

The target audience consists of ambitious professionals, engineers, and executives undergoing high-stakes interview cycles. The interface must communicate rigorous preparation, surgical precision, and grounded focus.

The visual direction merges **Minimalist Precision** with **Tactile Editorial Discipline**:
- High-contrast, publication-grade typographic scale.
- Structural borders (1px) framing content like architectural blueprints.
- A signature high-visibility accent tone (`Pulse Lime`) deployed exclusively to confirm decisions, highlight inflection points in performance metrics, or anchor the single primary action on a screen.
- Monospaced data displays for telemetry, real-time pace tracking, and aggregate readiness scores.

## Colors

The palette balances paper-like organic warmth with dense, technical darks. The system operates natively in two modes with distinct surface physics:

### Palette Structure
- **Ink Black (`#151713`)**: Base background in dark mode; primary typographic color and high-impact structural borders in light mode.
- **Deep Forest (`#20251D`)**: Subdued secondary surface tier in dark mode; deep contrast containers in light mode.
- **Warm Ivory (`#F5F3EA`)**: Canonical canvas tone for light mode. Replaces generic sterile white with the tactile presence of high-grade paper stock.
- **Paper White (`#FFFEF9`)**: Elevated tier in light mode for input surfaces, cards, and dialogue modals.
- **Pulse Lime (`#C7F36B`)**: High-luminance signal accent. Reserved strictly for pivotal CTAs, dynamic voice recording indicators, and score deltas. Must never cover more than 5% of any viewport.
- **Muted Sage (`#A7B09C`)**: Secondary text, subtle metadata, and muted badge backgrounds in dark contexts.
- **Slate Grey (`#74786F`)**: Editorial secondary copy, axis labels, and captions in light mode.
- **Border Grey (`#DCDDD3`)**: Clean 1px structural dividing lines and container outlines.
- **Success Green (`#34845B`)**: Qualified responses, benchmarks hit, stable pacing.
- **Amber (`#C68A35`)**: Hesitation warnings, answer drift alerts, elevated vocal speed.
- **Error Red (`#C75B50`)**: Critical feedback, session terminations, destructive actions.

### Balance Rules
- Never stack `Pulse Lime` against `Paper White` or `Warm Ivory`; `Pulse Lime` must only pair with `Ink Black` typography or sit directly on `Ink Black` / `Deep Forest` surfaces.
- Avoid using `Success Green` interchangeably with `Pulse Lime`. `Pulse Lime` is interactive energy; `Success Green` is an evaluative metric status.

## Typography

The typographic system pairs three specialized typefaces to balance human editorial voice with technical execution:
- **Manrope** provides authoritative, clean geometric headlines. Its structural proportions establish weight without defaulting to brutalist bulk.
- **Geist** delivers body copy with minimal distraction, high legibility at micro-scales, and balanced tracking.
- **JetBrains Mono** serves as the metrics and analytics engine. Used exclusively for timestamps, numerical telemetry, benchmark scores, keyboard shortcuts, and confidence indexes.

### Composition Guidelines
- **Measure:** Paragraph length should never exceed 68 characters to maintain an editorial reading cadence.
- **Tracking:** Headings must feature tight negative letter-spacing (`-0.015em` to `-0.03em`) to lock the words into crisp editorial lockups.
- **Tabular Figures:** Always apply `font-variant-numeric: tabular-nums` when using `JetBrains Mono` across performance scoreboards to prevent horizontal jitter during live interview audio evaluation.

## Layout & Spacing

The layout model is anchored by an asymmetrical 12-column layout that prioritizes content hierarchy over uniform tiling. The structure mirrors modern code editors and financial terminals.

### Grid & Breakpoints
- **Desktop (1280px and above)**: 12 columns, `margin-desktop` (3rem), `gutter` (1.5rem). Max container width is fixed at 1440px to ensure data density doesn't dilute across ultrawide monitors. Sidebars are anchored to a 280px fixed width; analytics cards span 8 or 4 columns.
- **Tablet (768px – 1279px)**: 8 columns, `margin` (2rem), `gutter-sm` (1rem). Dynamic panels fold into tabbed views or slide-over overlays.
- **Mobile (Below 768px)**: 4 columns, `margin-mobile` (1rem), `gutter-sm` (1rem). Complex metric rows reflow into vertical inspection stacks.

### Rhythm Principles
- Spacing follows a strict base-8 system, with 4px (`space-xs`) and 2px (`space-2xs`) used strictly for interior input padding, tags, and badge alignment.
- Whitespace is deliberate: dense micro-spacing inside cards (`space-md`) contrasted with generous breathing room (`space-2xl` to `space-3xl`) between major context shifts.

## Elevation & Depth

This design system avoids blurry drop-shadows and frosted glass. Spatial hierarchy is communicated through structural layering, border boundaries, and tonal shifting.

### Depth Hierarchy
- **Canvas Base**: The lowest tier (`Warm Ivory` in light mode, `Ink Black` in dark mode). It hosts foundational page frameworks and layout gutters.
- **Level 1 (Card & Section Containers)**: Elevated via surface color switch (`Paper White` against `Warm Ivory`; `Deep Forest` against `Ink Black`) bounded by a clean, razor-sharp 1px border (`#DCDDD3` in light mode, `#2C3328` in dark mode). No shadow.
- **Level 2 (Active States, Context Menus, Floating Tooltips)**: Uses an ultra-fine, crisp contact edge. Shadow is restricted to a precise, non-diffuse architectural falloff:
  - `0 1px 2px rgba(21, 23, 19, 0.05), 0 4px 12px rgba(21, 23, 19, 0.04)` in light mode.
  - Border transitions to a slightly higher contrast tone to preserve separation.
- **Level 3 (Modals, Overlays, Command Palette)**: Backed by a high-opacity dimming backdrop (`#151713` at 70% opacity, without blur). Card sits with a 1px solid structural border and an ambient depth offset: `0 8px 30px rgba(0, 0, 0, 0.12)`.

## Shapes

The design system favors crisp, restrained geometry over soft, bubbly contours.

- **Base Radius (`rounded-md`, 0.25rem / 4px)**: Default for interactive controls, badges, chips, code chips, and input text fields.
- **Card Radius (`rounded-lg`, 0.5rem / 8px)**: Applied to self-contained surface containers, performance cards, video playback panels, and analytics boards.
- **Modal Radius (`rounded-xl`, 0.75rem / 12px)**: Applied exclusively to major sheet dialogues and full overlays.
- **Pills (`9999px`)**: Explicitly forbidden for primary buttons and large cards. Reserved strictly for small, dense telemetry indicators (e.g., active audio status, mini-tags, live transcription markers).

## Components

### Buttons
- **Primary CTA**: Background `Pulse Lime` (`#C7F36B`), text `Ink Black` (`#151713`), font `Geist` Medium (0.875rem), radius `rounded-md` (4px), padding `0.5rem 1rem`. Hover state introduces a clean 10% dark tint overlay; active state scales to 0.99. No shadows.
- **Secondary**: Surface `Paper White`, border 1px solid `Border Grey` (`#DCDDD3`), text `Ink Black`. Hover state shifts border to `Slate Grey`.
- **Tertiary / Ghost**: Transparent fill, text `Slate Grey`. Hover transitions to `Warm Ivory` background and `Ink Black` text.
- **Destructive**: Background transparent, border 1px solid `Error Red`, text `Error Red`. Hover fills with `Error Red` with white text.

### Chips & Badges
- **Metric Badges**: Monospace typeface (`JetBrains Mono`), uppercase, 0.75rem. Surface set to transparent with a 1px border colored according to the state (`Success Green`, `Amber`, or `Border Grey`). Padding `0.125rem 0.375rem`.
- **Status Indicator Chip**: Small dot (6px) with an accompanying label. When live recording is engaged, the dot pulses in `Pulse Lime`.

### Form Fields & Inputs
- **Base Style**: Surface `Paper White`, 1px border `Border Grey`, radius `rounded-md`, padding `0.625rem 0.875rem`. Typography `Geist` regular (0.9375rem).
- **Focus State**: Hard outline switch—1px border shifts to `Ink Black` with a 1px offset ring in `Pulse Lime`. Never use soft, fuzzy browser rings.
- **Error State**: 1px border `Error Red`, helper text in `Error Red` set at 0.75rem.

### Cards & Panels
- **Analytics Card**: Surface `Paper White`, structural 1px border `Border Grey`, internal padding `space-lg` (1.5rem). The header region is segregated from card content by a fine 1px bottom border rule.
- **Interview Transcript Card**: Alternating speaker panels. The AI interviewer response is housed in an enclosed `Warm Ivory` container; the candidate's transcribed response sits on `Paper White` with a vertical 2px indicator bar running alongside.

### Selection Controls (Checkboxes & Radios)
- **Checkboxes**: 16px square, radius 3px. Checked state: filled `Ink Black` with a sharp 1.5px checkmark rendered in `Pulse Lime`.
- **Radios**: 16px circle. Checked state: outer ring `Ink Black` with a centered 6px solid dot in `Pulse Lime`.

### Specialized PrepPulse Components
- **Pacing & Cadence Gauge**: Horizontal split track (height 4px) in `Border Grey`. Safe operating zone marked with a 1px indicator bracket. Real-time WPM pointer rendered as a high-contrast tick in `Ink Black`.
- **Answer Structure Timeline (STAR Method)**: Segmented step bar broken into Situation, Task, Action, and Result. Active segment highlighted with a solid bottom border in `Pulse Lime`, accompanied by duration in `JetBrains Mono`.