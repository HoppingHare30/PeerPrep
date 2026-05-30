# Document 04: UI/UX Design Brief
**PeerPrep — Peer Mock Interview Platform**  
**Version 1.0 — June 2026**

---

## 1. Aesthetic Direction
* **Design Philosophy:** Warm, structured, and purposeful. PeerPrep should feel like a tool students trust — not a toy.
* **Reference Style:** LeetCode's information density and layout logic, but warmer and more personal.
* **Anti-patterns:** Avoid typical generic unstyled templates, standard unedited gray cards, excessive gradient soup, or indiscriminate glassmorphism.
* **Palette Identity:** The beige-orange-green palette gives PeerPrep a distinctive, human identity in a space dominated by cold tech blues.
* **Theme Modes:** Light mode (Primary) is active by default. Dark mode (Secondary) is supported as a user-controlled toggle.

---

## 2. Color Palette

### Light Mode (Primary)
| Role | Name | Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Background** | Warm Beige | `#FAF7F2` | Page background, app shell |
| **Surface** | Off-White | `#FFFFFF` | Cards, modals, panels, sidebar |
| **Border** | Warm Grey | `#E8E0D5` | Card borders, dividers, input borders |
| **Primary Accent** | Muted Orange | `#C4622D` | CTAs, active nav, links, badges, focus rings |
| **Secondary Accent**| Muted Green | `#4A7C59` | Success states, 'Experienced' badge, completed status |
| **Text Primary** | Dark Warm Grey| `#2C2416` | Body text, headings |
| **Text Secondary**| Medium Warm Grey|`#7A6E64` | Subtitles, placeholders, helper text |
| **Orange Tint** | Light Orange | `#F5E6DC` | Hover states, highlighted rows, info boxes |
| **Green Tint** | Light Green | `#DCF0E4` | Success banners, accepted status background |
| **Destructive** | Warm Red | `#991B1B` | Error states, cancel/decline actions |

### Dark Mode (Secondary)
| Role | Name | Hex |
| :--- | :--- | :--- |
| **Background** | Dark Background | `#1C1C1A` |
| **Surface** | Dark Surface | `#252523` |
| **Border** | Dark Border | `#3A3A36` |
| **Primary Accent** | Muted Orange | `#D4733D` |
| **Secondary Accent**| Muted Green | `#5A8F6A` |
| **Text Primary** | Light Off-White | `#F0EBE3` |
| **Text Secondary**| Cool Grey | `#9A9590` |

---

## 3. Typography
| Element | Font | Size | Weight | Color (Light Mode) |
| :--- | :--- | :--- | :--- | :--- |
| **App Name / Logo** | Inter or Geist | `24px` | 700 Bold | `#C4622D` (Orange) |
| **Page Headings (H1)**| Inter | `28px` | 700 Bold | `#2C2416` |
| **Section Headings (H2)**| Inter | `20px` | 600 SemiBold | `#2C2416` |
| **Card Titles** | Inter | `16px` | 600 SemiBold | `#2C2416` |
| **Body Text** | Inter | `14px` | 400 Regular | `#2C2416` |
| **Helper / Secondary**| Inter | `13px` | 400 Regular | `#7A6E64` |
| **Code / Technical** | Geist Mono | `13px` | 400 Regular | `#2C2416` |
| **Nav Labels** | Inter | `14px` | 500 Medium | `#7A6E64` (Inactive) / `#C4622D` (Active) |
| **Buttons (Primary)** | Inter | `14px` | 600 SemiBold | `#FFFFFF` on `#C4622D` |

---

## 4. Component Specifications
* **Border Radius:** `8px` for cards and panels; `6px` for inputs and buttons; `4px` for badges; `12px` for modals.
* **Card Style:** White background, `1px` `#E8E0D5` border, `4px` box-shadow (`rgba(0,0,0,0.04)`), `8px` radius.
* **Button (Primary):** `#C4622D` background, white text, `6px` radius, `12px/20px` padding, hover: darken 8%.
* **Button (Secondary):** White background, `#E8E0D5` border, `#2C2416` text, hover: `#F5E6DC` background.
* **Button (Destructive):** `#991B1B` background, white text, same sizing as primary.
* **Input Fields:** White background, `#E8E0D5` border, focus ring: `2px` `#C4622D`, `6px` radius, `10px/14px` padding.
* **Sidebar (Desktop):** `240px` fixed, white background, `#E8E0D5` right border. Active link: `#F5E6DC` bg + `#C4622D` left border `3px`.
* **Bottom Tab Bar (Mobile):** `64px` height, white background, `#E8E0D5` top border. Active icon: `#C4622D`.
* **Badges:**
  * **Targeting:** `#F5E6DC` background, `#C4622D` text, `4px` radius.
  * **Experienced / Completed:** `#DCF0E4` background, `#4A7C59` text, `4px` radius.
  * **Pending:** `#FEF3C7` background, `#92400E` text.
  * **Cancelled:** `#FEE2E2` background, `#991B1B` text.
* **Rating stars / score:** 5-star visual using filled/empty circles or stars in `#C4622D`.
* **Shadows:** Very subtle. Cards: `0 1px 4px rgba(0,0,0,0.04)`. Modals: `0 8px 24px rgba(0,0,0,0.10)`. No heavy drop shadows.

---

## 5. Session Screen Layout
* **Three-Panel Layout (Live Session, Desktop):**
  * **Left Panel (`280px` fixed):** Question checklist — DSA questions with expand/collapse for brute/optimal hints, HR questions, project questions.
  * **Centre Panel (flex-grow):** Daily.co video iframe. Full height. Fallback 'Open in new tab' link below.
  * **Right Panel (`320px` fixed):** Feedback form — 5 star-rating fields + notes textarea + Submit button.
  * **Separators:** `1px` `#E8E0D5` borders separating the panels.
* **Mobile Layout (<1024px):** Stacks panels vertically: Video call (top) $\rightarrow$ Questions (middle) $\rightarrow$ Feedback form (bottom).
* **Pre-Session State:** Question sheet takes full width. No feedback panel. 'Session starts at [time]' countdown chip.

---

## 6. Design References
* **LeetCode:** Borrow high information density, problem list layouts, difficulty badge styling, and code panel split views.
* **Linear:** Borrow clean sidebar structures, active link treatments, and card spacing.
* **Vercel Dashboard:** Borrow stats display cards, minimal table layouts, and status badge patterns.
* **Notion:** Borrow warm neutral background palette and readable typography hierarchies.

---

## 7. Responsiveness Rules
* **Breakpoints:** Mobile `< 768px`, Tablet `768px – 1023px`, Desktop $\ge 1024$px.
* **Sidebar:** Replaced by bottom tab bar (Dashboard, Search, Sessions, Profile) on mobile and tablet.
* **Grid Layouts:** Search results adapt from 3-column grid (desktop) $\rightarrow$ 2-column grid (tablet) $\rightarrow$ 1-column stack (mobile).
* **Touch Targets:** Minimum interactive size of `44x44px`.
* **Font Scaling:** Never scale body text below `13px` on mobile.
