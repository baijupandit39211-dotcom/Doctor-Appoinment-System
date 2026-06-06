# Components Map - DocPulse

## Main Files

| File | Purpose |
|---|---|
| `app/layout.tsx` | Root app layout for Next.js |
| `app/page.tsx` | Landing page route |
| `app/(auth)/login/page.tsx` | Login page |
| `app/(auth)/register/page.tsx` | Register page |
| `app/(dashboard)/patient/page.tsx` | Patient dashboard |
| `app/(dashboard)/doctor/page.tsx` | Doctor dashboard |
| `app/(dashboard)/admin/page.tsx` | Clinic admin dashboard |
| `app/(dashboard)/superadmin/page.tsx` | Super admin dashboard |
| `components/landing/` | Landing page sections |
| `components/dashboard/` | Dashboard UI components |
| `components/ui/` | Shared shadcn-style UI components |
| `lib/utils.ts` | Shared utilities such as `cn()` |
| `server/` | Express backend source |

## Landing Sections

| Component | Purpose |
|---|---|
| `Nav` | Responsive navbar |
| `Hero` | Product introduction and CTAs |
| `HeroDashboard` | Static dashboard preview |
| `Trusted` | Stats and social proof |
| `Bento` | Feature grid |
| `Showcase` | Product showcase |
| `HowItWorks` | Step-by-step flow |
| `Benefits` | Outcome-focused benefits |
| `Testimonials` | Customer quotes |
| `Security` | Compliance and trust messaging |
| `Pricing` | Pricing cards |
| `FAQ` | Questions and answers |
| `FinalCTA` | Final conversion block |
| `Footer` | Site footer |

## Dashboard Areas

| Area | Purpose |
|---|---|
| Patient dashboard | Book and manage appointments |
| Doctor dashboard | View schedule and patient details |
| Clinic admin dashboard | Manage doctors, departments, appointments, and reports |
| Super admin dashboard | Manage clinics and platform settings |

## Shared UI

- Buttons
- Inputs
- Cards
- Dialogs
- Tabs
- Tables
- Accordions
- Badges
- Avatars

