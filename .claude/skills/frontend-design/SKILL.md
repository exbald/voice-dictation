---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Workflow**: What happens *after* the user interacts with this interface? Where does the output go? Consider the full journey from input to final action.
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## shadcn/ui Project Setup

When creating new projects with shadcn/ui, use the CLI to scaffold with full configuration:

```bash
pnpm dlx shadcn@latest init
```

### CLI Options

| Flag | Description | Values |
|------|-------------|--------|
| `-t, --template` | Project template | `next`, `next-monorepo` |
| `-b, --base-color` | Base color | `neutral`, `gray`, `zinc`, `stone`, `slate` |
| `-y, --yes` | Skip confirmation | boolean |
| `-f, --force` | Overwrite existing config | boolean |
| `--src-dir` | Use src directory | boolean |
| `--css-variables` | CSS variable theming (default: true) | boolean |
| `--no-base-style` | Skip base style installation | boolean |

### Visual Styles (5 Presets)

- **Vega** – The classic shadcn/ui look
- **Nova** – Reduced padding and margins for compact layouts
- **Maia** – Soft and rounded, with generous spacing
- **Lyra** – Boxy and sharp; pairs well with mono fonts
- **Mira** – Compact; made for dense interfaces

**Note**: The "default" style is deprecated. New projects use "new-york" as base.

### Component Library

Choose between **Radix** or **Base UI** as your component library. Base UI (from the creators of Radix, Floating UI, and Material UI) offers improved accessibility and flexibility.

### Icon Libraries

- **Lucide** – Clean, consistent icons (default)
- **Tabler** – Larger icon set with varied weights
- **HugeIcons** – Extensive collection with multiple styles

### Tailwind v4 Support

shadcn now supports Tailwind v4 with:
- CSS-first configuration using `@theme` directive
- OKLCH color space (converted from HSL)
- Updated components for React 19

### Theme Colors

Available theme accent colors: Red, Orange, Amber, Yellow, Lime, Green, Emerald, Teal, Cyan, Sky, Blue, Indigo, Violet, Purple, Fuchsia, Pink, Rose

Ask the user for their preferences before scaffolding.

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts intentionally. Popular choices like Inter, system fonts, or Geist are great when they fit the context. For distinctive projects, consider characterful alternatives: Satoshi, Cabinet Grotesk, General Sans, Clash Display (display), or Switzer, Plus Jakarta Sans, DM Sans (body). The problem isn't any specific font—it's defaulting without thought.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library (formerly Framer Motion) for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

AVOID generic AI-generated aesthetics: cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. Don't converge on the same choices across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

## Output & Integration Patterns

When building tools that generate output (emails, documents, exports, etc.), think beyond copy-to-clipboard. Consider the fastest path from your UI to the user's actual goal:

**Email Integration** - Prefer direct compose links over copy/paste:
- Gmail: `https://mail.google.com/mail/?view=cm&fs=1&to={email}&su={subject}&body={body}`
- Outlook: `https://outlook.office.com/mail/deeplink/compose?to={email}&subject={subject}&body={body}`
- Universal: `mailto:{email}?subject={subject}&body={body}`

**Other Common Integrations**:
- File downloads: Generate and trigger downloads for exports (CSV, PDF, JSON)
- Calendar: `https://calendar.google.com/calendar/render?action=TEMPLATE&text={title}&dates={start}/{end}`
- Share links: Native Web Share API (`navigator.share()`) for mobile-friendly sharing
- Deep links: Link directly into other apps when possible (Slack, Notion, etc.)

**Principle**: If the user will immediately take their output somewhere else, build the bridge for them. One click beats copy-paste-switch-paste.

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.
