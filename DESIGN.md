# Gate2Tray OS Design System

## Direction

Gate2Tray OS uses a restrained product register: crisp white working surfaces, dark berry-tinted ink, a muted berry primary for operator-controlled actions, and teal for confirmed execution. The visual system should feel composed at a bright gate desk and remain legible in a dim cabin. Intelligence is expressed through evidence, policy checks, and completed work—not decoration.

## Color

- Background: `oklch(1 0 0)`
- Surface: `oklch(0.968 0.006 330)`
- Elevated surface: `oklch(0.985 0.003 330)`
- Ink: `oklch(0.205 0.025 330)`
- Muted ink: `oklch(0.46 0.018 330)`
- Primary: `oklch(0.56 0.16 330)`
- Primary dark: `oklch(0.45 0.14 330)`
- Accent/confirmed: `oklch(0.50 0.105 175)`
- Warning: `oklch(0.66 0.14 78)`
- Danger: `oklch(0.54 0.18 25)`
- Borders: `oklch(0.89 0.008 330)`

Status is always communicated with text and shape in addition to color.

## Typography

Use one familiar sans-serif stack: Inter when available, followed by system UI fonts. Product headings use a compact fixed scale and moderate weight. Operational data uses tabular numerals. Body copy stays at 14–16 px and avoids line lengths above 70 characters.

## Shape and Elevation

Controls use 8–10 px corners; panels use 12–14 px corners. Buttons may be pill-shaped only when the shape communicates a compact status or segmented action. Working surfaces use borders or tight, low-blur shadows, never both decoratively. Touch targets are at least 44 px.

## Layout

The operator surface uses a persistent left rail on desktop and a compact top navigation on mobile. The primary column prioritizes flight status and approval work; the secondary column holds current impact and agent history. Passenger and crew pages use a single-task mobile-first layout with sticky action areas where helpful.

## Components

Buttons, fields, tabs, badges, dialogs, progress rows, inventory bars, and timelines share one state vocabulary. Primary actions are berry; completed actions are teal; destructive actions are explicit and confirmation-gated. Important controls always include text labels. Loading uses skeleton blocks; empty states explain the next useful action.

## Motion

Transitions last 150–220 ms and communicate state changes only. Reduced-motion mode removes transforms and nonessential transitions.

