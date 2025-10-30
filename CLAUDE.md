# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based video editor application built with Next.js 15, TypeScript, and Remotion. It provides a timeline-based editing interface with support for multi-track editing, animations, transitions, effects, and video rendering.

## Development Commands

### Core Development
```bash
pnpm install          # Install dependencies
pnpm dev              # Start development server (http://localhost:3000)
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run Next.js linter
pnpm format           # Format code with Biome
```

### Code Formatting
The project uses **Biome** (not Prettier/ESLint) for formatting and linting:
- Formatting: Tab indentation, double quotes
- Auto-organize imports on format
- Run `pnpm format` before committing

## Architecture

### Core Technology Stack
- **Framework**: Next.js 15 (App Router)
- **Video Engine**: Remotion 4.x for video rendering and playback
- **State Management**: Zustand for global state
- **Timeline**: Custom `@designcombo/timeline` canvas-based timeline component
- **Animations**: `@designcombo/animations` library
- **Events**: RxJS-based event system via `@designcombo/events`
- **UI Components**: Radix UI primitives with custom styling
- **Styling**: Tailwind CSS

### Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes
│   │   ├── render/               # Video rendering endpoints
│   │   ├── pexels/               # Stock media integration
│   │   ├── transcribe/           # Audio transcription
│   │   └── uploads/              # File upload handling
│   ├── edit/                     # Main editor page
│   └── layout.tsx                # Root layout
├── features/
│   └── editor/                   # Main editor feature
│       ├── scene/                # Canvas scene (Remotion Player integration)
│       ├── timeline/             # Timeline UI and controls
│       ├── player/               # Remotion composition components
│       ├── menu-item/            # Left sidebar menu items (images, videos, text, etc.)
│       ├── control-item/         # Right sidebar property controls
│       ├── store/                # Editor-specific Zustand stores
│       ├── hooks/                # Custom hooks (timeline events, etc.)
│       └── utils/                # Editor utilities
├── components/
│   ├── ui/                       # Shared Radix UI components
│   ├── color-picker/             # Custom color picker
│   └── shared/                   # Shared components
├── store/                        # Global Zustand stores
└── lib/                          # Shared utilities
```

### State Management Architecture

The application uses multiple Zustand stores for different concerns:

1. **Editor Store** (`src/features/editor/store/use-store.ts`):
   - Timeline instance reference
   - Track items and transitions
   - Active selections
   - Player reference
   - Duration, FPS, scale, scroll state

2. **Scene Store** (`src/store/use-scene-store.ts`):
   - Canvas scene state

3. **Layout Store** (`src/features/editor/store/use-layout-store.ts`):
   - UI layout state (sidebars, panels)

4. **Data Store** (`src/features/editor/store/use-data-state.ts`):
   - Fonts, assets, and media data

### Event-Driven Communication

The editor uses an RxJS-based event system (`@designcombo/events`) for cross-component communication:

- **Player Events** (`PLAYER_PLAY`, `PLAYER_PAUSE`, `PLAYER_SEEK`, etc.): Control video playback
- **Timeline Events** (`TIMELINE_SEEK`, etc.): Timeline interactions
- **Layer Events** (`LAYER_SELECTION`, etc.): Element selection via `@designcombo/state`

Events are dispatched using `dispatch(EVENT_NAME, { payload })` and subscribed to via RxJS pipes in `useTimelineEvents` hook.

### Timeline System

The timeline is a custom canvas-based component (`@designcombo/timeline`):
- Tracks are represented as `ITrack[]` with nested `ITrackItem[]`
- Timeline state includes: duration, fps, scale (zoom), scroll position
- Synchronizes with Remotion Player via event subscriptions
- Resizes dynamically based on panel dimensions

### Remotion Integration

- **Compositions**: Defined in `src/features/editor/player/`
- **Player**: Uses `@remotion/player` for real-time preview
- **Rendering**: API routes handle server-side rendering via DesignCombo API
- **Track Items**: Map to Remotion Sequences with animations and transitions

### API Routes

- **`/api/render`**: Creates project and initiates video export via DesignCombo API
- **`/api/render/[id]`**: Polls rendering status
- **`/api/pexels`**: Fetches stock images from Pexels
- **`/api/pexels-videos`**: Fetches stock videos from Pexels
- **`/api/transcribe`**: Audio transcription service
- **`/api/uploads/presign`**: Generates presigned upload URLs
- **`/api/uploads/url`**: Handles upload URL generation

### Environment Variables

Required in `.env`:
```
PEXELS_API_KEY=              # Pexels stock media API key
COMBO_SK=                    # DesignCombo API secret key (for rendering)
COMBO_SH_JWT=                # DesignCombo JWT token (for status checks)
```

## Key Implementation Patterns

### Adding New Track Items
1. Define track item type in `@designcombo/types`
2. Create corresponding Remotion component in `src/features/editor/player/items/`
3. Add UI controls in `src/features/editor/control-item/`
4. Update timeline rendering logic to handle new item type

### Working with Animations
- Animations use `@designcombo/animations` library
- Applied via `Animated` wrapper component in Remotion compositions
- Configured through animation properties on track items
- Supports entrance, exit, and continuous animations

### Font Loading
- Fonts are preloaded via `loadFonts()` utility
- Font data stored in `src/features/editor/data/fonts`
- Compact font data cached in data store for performance

### Responsive Layout
- Uses `useIsLargeScreen()` hook to detect screen size
- Large screens: Vertical sidebar layout
- Small screens: Horizontal bottom menu layout
- Resizable panels via `react-resizable-panels`

## Testing & Quality

- No test framework currently configured
- Biome handles linting with relaxed rules for `noUnusedVariables`, `useExhaustiveDependencies`, `noExplicitAny`
- React Strict Mode is **disabled** (`reactStrictMode: false` in `next.config.ts`)

## Important Notes

- **Package Manager**: Must use `pnpm` (specified in `package.json` packageManager field)
- **Node Target**: ES2017 (check `tsconfig.json`)
- **Path Alias**: `@/*` maps to `./src/*`
- **State Manager**: The `@designcombo/state` library manages layer state and selections independently from Zustand
- **Remotion Version**: Using v4.x - check compatibility when upgrading
- **Timeline Sync**: Player and timeline sync via events - avoid direct coupling
