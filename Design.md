# Design.md — Colors, Theme & Typography

## 1. Design Direction

Clean, trustworthy, "government/real-estate-grade" institutional feel — similar tone to the DHA Marketplace reference: navy blue primary, teal accents, high-contrast white cards over satellite map imagery, orange/blue plot-status coding. The UI must feel credible and secure (this is a platform handling legal property transactions), not flashy.

---

## 2. Color Palette

### Primary
| Token | Hex (suggested) | Usage |
|---|---|---|
| `--primary-navy` | `#0B2A4A` | Header text, primary buttons ("Register Now"), key CTAs |
| `--primary-teal` | `#0E7C86` | Filters panel header gradient, active states, links |
| `--accent-green` | `#0F7A3D` | Success states, banners, "verified" badges |

### Status / Data Colors (map & badges)
| Token | Hex (suggested) | Usage |
|---|---|---|
| `--plot-residential` | `#F5A623` (orange) | Residential plot markers/legend |
| `--plot-commercial` | `#2F6FE0` (blue) | Commercial plot markers/legend |
| `--status-reserved` | `#E0A800` | Reserved plot badge |
| `--status-sold` | `#6B7280` (gray) | Sold/unavailable plot badge |
| `--status-available` | `#0F7A3D` | Available/unsold badge |
| `--status-verified` | `#0E7C86` | "RDA Verified" / "Admin Verified" badge |
| `--alert-warning-bg` | `#FDECEA` | Disclaimer banners (e.g. price exclusions) |
| `--alert-warning-text` | `#C0392B` | Disclaimer text |

### Neutrals
| Token | Hex | Usage |
|---|---|---|
| `--bg-base` | `#FFFFFF` | App background / cards |
| `--bg-muted` | `#F5F7FA` | Sidebar/filter panel background |
| `--border` | `#E2E8F0` | Card/input borders |
| `--text-primary` | `#111827` | Body/headings |
| `--text-secondary` | `#6B7280` | Labels, meta text |

### Map Overlay Colors
- Phase boundary outline: dashed white (`#FFFFFF`, 2px dash) over satellite imagery for contrast.
- Cluster bubble: `--primary-teal` fill, white bold number text.
- Amenity icons: white circle background, green (`--accent-green`) icon glyph.

---

## 3. Typography

- **Primary font**: `Inter` (or `Manrope`) — clean, highly legible sans-serif for UI text, numbers, and forms.
- **Heading font**: `Inter` (Semi-Bold/Bold) — keep a single type family for consistency; differentiate via weight/size, not multiple font families.
- **Numeric/price displays**: use tabular figures (`font-variant-numeric: tabular-nums`) for price and plot-size alignment in tables/sidebars.

### Type Scale
| Level | Size | Weight | Usage |
|---|---|---|---|
| Display | 32–40px | 700 | Landing hero headline |
| H1 | 28px | 700 | Page titles ("Selected Plot") |
| H2 | 22px | 600 | Section headers |
| H3 | 18px | 600 | Card titles ("Plot 24") |
| Body | 15–16px | 400 | Paragraph/body text |
| Label | 13px | 500 | Form labels, filter labels |
| Caption | 12px | 400 | Meta info, disclaimers |

---

## 4. Component Styling Guidelines

- **Buttons**: solid navy primary (`--primary-navy`), white text, rounded (`8px` radius), teal used sparingly for secondary/active toggle buttons (e.g. "Map view" active state).
- **Cards** (Plot Detail Sidebar): white background, subtle border/shadow, status pills top-right (`Residential` green pill, `Unsold`/`Reserved`/`Sold` colored pill).
- **Filters Panel**: teal-to-navy gradient header bar, white body, checkbox/slider controls with teal accent color, sticky "Apply"/"Reset" buttons at top and bottom.
- **Badges**: pill-shaped, small caps or sentence case, colored per status token above (`Verified`, `RDA Verified`, `Reserved`, `Sold`).
- **Map controls**: floating white rounded-square buttons (zoom, layers, locate) top-right, consistent 8px spacing, subtle shadow.
- **Disclaimer banners**: light red/orange background (`--alert-warning-bg`) with matching text color, used for legal/tax-exclusion notices — never hide these behind tooltips, always visible inline.
- **Forms**: label above input, teal focus ring, inline validation error text in `--alert-warning-text`.

---

## 5. Iconography

- Use a single consistent icon set (e.g. `lucide-react`) throughout — map controls, amenities, dashboard nav, badges.
- Amenity icons on map: mosque, park/tree, hospital (red cross), school — small circular white-background icons matching the reference screenshots.

---

## 6. Theming Setup

- Implement all tokens above as CSS variables in `globals.css`, mapped into `tailwind.config.ts` `theme.extend.colors` so components reference semantic names (`bg-primary`, `text-status-reserved`) rather than raw hex values.
- Support a single light theme for MVP; structure tokens so a dark theme could be added later without a rewrite.
