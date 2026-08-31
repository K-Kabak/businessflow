# BusinessFlow UI guidelines

BusinessFlow uses a calm, compact operations-workspace aesthetic. The interface should communicate hierarchy through typography, spacing, dividers, and surface contrast rather than repeated cards, large shadows, or saturated color.

## Foundations

- Geist is the product typeface. Page titles use 24/32 semibold, section titles 16/24 semibold, body text 14/22, table text 13/20, and metadata 12/16.
- The spacing scale is 4, 8, 12, 16, 20, 24, 32, 40, and 48 pixels.
- Controls use a 6px radius, panels and tables 8px, dialogs 10px, and only avatars or chips use a pill shape.
- The iris accent is reserved for primary actions, focus, active navigation, and in-progress states. Danger, warning, success, and information colors are semantic.
- Default surfaces are flat. Shadows are limited to dialogs, menus, drag overlays, and other elevated elements.

## Layout and density

- App navigation is 240px wide and the top bar is 56px high.
- Dashboard and data pages use a maximum width of 1440px; forms 1024px; settings 1152px; the board uses the available width.
- Desktop table rows target 52px. Mobile data pages render deliberate record lists instead of relying on clipped tables.
- The Kanban board scrolls inside its columns on desktop and snaps horizontally between approximately 85vw columns on mobile.

## Interaction and accessibility

- Interactive states use 120–160ms color, border, opacity, or transform transitions.
- Focus is always visible with a 2px iris outline and 2px offset.
- Touch targets are at least 44px on mobile. Icon-only controls require an accessible label.
- Reduced-motion preferences disable nonessential transitions and animations.
- Light and dark themes use independently tuned surface levels and must both meet WCAG AA contrast for normal text.

## Visual QA viewports

- Desktop: 1440×900
- Laptop: 1280×800
- Tablet: 768×1024
- Mobile: 390×844

Core screenshot coverage includes Login, Dashboard, Clients, and Board in light and dark themes at desktop and mobile sizes. Secondary checks cover detail pages, forms, Tasks, Team, Activity, and Settings.
