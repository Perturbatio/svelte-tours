# Interactive UI Tour Package — Implementation Plan

## 1. Overview and Goals

Build a lightweight, reusable interactive UI tour package using **Svelte 5**, **TypeScript**, **Vite**, **Vitest**, and
**Tailwind CSS v4.3** (`@tailwindcss/vite`).

To ensure the package works in both Svelte and non-Svelte projects, divide it into two layers:

1. **Core Tour Engine (`@perturbatio/tours/core`):** Framework-agnostic TypeScript module that manages tour definitions,
   active state, navigation, chaining (`nextTour`), event triggers, DOM target observation, and `localStorage`
   persistence.
2. **Svelte 5 UI Layer (`@perturbatio/tours`):** Svelte 5 components built with runes (`$state`, `$derived`, `$effect`)
   that render the overlay mask, target cutouts, and tooltip card using CSS custom properties.

---

## 2. Package Structure

```text
perturbatio-tours/
├── bin/
│   └── dump-theme.js          # CLI script to export default theme (JSON, JS, or TS)
├── src/
│   ├── core/
│   │   ├── types.ts           # TypeScript interfaces for Tour, Section, Theme, and State
│   │   ├── Tour.ts            # Tour model class and JSON normalization
│   │   ├── TourManager.ts     # Singleton/instance manager enforcing one active tour
│   │   ├── storage.ts         # localStorage read/write/reset helpers
│   │   ├── domObserver.ts     # Target element lookup, grace period timer, and bounding boxes
│   │   └── defaultTheme.ts    # Default theme values and CSS variable mapping
│   ├── svelte/
│   │   ├── TourProvider.svelte # Root tour UI container (overlay + tooltip)
│   │   ├── TourOverlay.svelte  # Semi-transparent SVG/CSS multi-cutout mask
│   │   └── TourTooltip.svelte  # Anchored/top-centered tooltip with controls
│   └── index.ts               # Public exports
├── tests/
│   ├── core/                  # Unit tests for TourManager, storage, chaining, and grace period
│   └── svelte/                # Component tests using Vitest
├── package.json
├── vite.config.ts
└── vitest.config.ts
```

3. Core Data Model and API
   3.1 Tour and Section Definitions

Developers can define tours as plain JSON objects, TypeScript objects, or Tour instances.

export interface TourSectionContent {
title: string;
content?: string;
description?: string;
}

export interface TourSection {
elements: string[];
content: TourSectionContent;
targetGraceMs?: number; // Overrides tour/global grace period for this section
}

export interface TourConfig {
name: string;
autoStart?: boolean;
triggerEvent?: string; // Optional DOM/custom event name that starts this tour
nextTour?: string; // Name of the tour to launch when clicking Next on the last section
targetGraceMs?: number; // Default grace period (ms) to wait for missing target elements
showRestartButton?: boolean; // Displays optional restart button in tooltip
sections: Record<string, TourSection>;
}

3.2 Manager API (tours)

    tours.setTheme(theme: Partial<TourTheme>): void — Applies custom style values over the default theme.

    tours.addTour(tour: Tour | TourConfig): void — Registers a tour definition. If autoStart is true and the tour is not marked dismissed or completed in localStorage, schedules auto-start.

    tours.start(name: string, options?: { resume?: boolean }): void — Starts the specified tour. Stops any other active tour first so only one tour runs at a time. Resumes from the saved section if resume is enabled or saved progress exists.

    tours.next(): void — Advances to the next section in the active tour. On the final section, if nextTour is defined, marks the current tour completed and starts nextTour.

    tours.previous(): void — Moves to the previous section in the active tour.

    tours.close(): void — Closes the active tour, marks it as dismissed (preventing future auto-start), and keeps the last displayed section in localStorage.

    tours.restart(name?: string): void — Clears saved localStorage state (dismissed, completed, and last section) for the tour and starts from the first section.

4. State Persistence Rules (localStorage)

Store state under a configurable namespace key (for example, perturbatio_tours_state):

export interface StoredTourState {
dismissed: boolean;
completed: boolean;
lastSectionKey: string | null;
}

| User / System Action                                 | dismissed | completed | lastSectionKey                                       | Auto-Starts on Next Visit? |
|------------------------------------------------------|-----------|-----------|------------------------------------------------------|----------------------------|
| Tour advances to section X                           | Unchanged | false     | """X"""                                              | Yes (if autoStart: true)   |
| User clicks Close                                    | true      | false     | Current section key                                  | No (can resume manually)   |
| User finishes last section                           | false     | true      | null                                                 | No                         |
| Developer calls start(name) or explicit resume event | Unchanged | Unchanged | Resumes at lastSectionKey (or first section if null) | N/A                        |
| User clicks Restart / restart(name)                  | false     | false     | First section key                                    | Yes (if autoStart: true)   |

5. Overlay, Multi-Target Highlighting, and Grace Period
   5.1 Multi-Element Highlighting

   When a section specifies multiple CSS selectors in elements (for example, [".header-help", ".sidebar-help"]), query
   all matching visible elements in the DOM.

   Compute the bounding rectangle (getBoundingClientRect()) plus configurable padding for each matched element
   individually.

   Render the overlay mask using an SVG <mask> (or clip-path cutouts) with individual transparent holes for each target
   rectangle. Any element between or outside those rectangles remains covered by the semi-transparent mask.

   Anchor the tooltip card to the first matched element in the elements list.

   Recalculate positions on window resize and scroll events.

5.2 Missing Target Grace Period

    When a section activates and none of its elements exist or are visible in the DOM:

        Start a timer for targetGraceMs (default: 1000 ms, configurable globally, per tour, or per section).

        Observe the DOM with a MutationObserver (and short fallback poll) during the grace period.

        If a target element appears before the timer ends, cancel the timer, highlight the element(s), and anchor the tooltip to the first target.

        If the grace period expires with no matching elements, render the full overlay mask with no cutouts and display the tooltip centered at the top of the viewport.

6. Navigation Controls

   Previous button: Moves to the previous section. Disabled when the user is on the first section of the active tour.

   Next button: Moves to the next section.

    * When on the last section and nextTour is set, clicking Next completes the current tour and immediately starts
      nextTour.
    * When on the last section and nextTour is not set, the Next button is disabled (or acts as a Done/Finish button per
      configuration; disabled by default per requirement).

    * Close button: Always enabled while a tour is active. Closes the overlay, saves lastSectionKey, and sets
      `dismissed = true`.

    * Restart Tour button (optional): Controlled by showRestartButton. Resets stored state for the active tour and jumps
      back to its first section.

7. Styling and Theme Configuration

No Tailwind utility classes are hard-coded into the rendered markup. All styles resolve through CSS custom properties
with sensible defaults.

7.1 Configurable Theme Keys (TourTheme)

| Theme Key        | 	CSS Variable           | 	Default Value                  | 	Description                         |
|------------------|------------------------|--------------------------------|-------------------------------------|
| maskBgColor      | 	--pt-mask-bg-color     | 	#000000                        | 	Overlay mask fill color             |
| maskTransparency | 	--pt-mask-transparency | 	0.6                            | 	Overlay opacity (0 to 1)            |
| highlightPadding | 	--pt-highlight-padding | 	6px                            | 	Space around highlighted targets    |
| highlightRadius  | 	--pt-highlight-radius  | 	6px                            | 	Corner radius of target cutouts     |
| tipBgColor       | 	--pt-tip-bg-color      | 	#ffffff                        | 	Tooltip background color            |
| tipTextColor     | 	--pt-tip-text-color    | 	#111827                        | 	Tooltip body text color             |
| tipTitleColor    | 	--pt-tip-title-color   | 	#000000                        | 	Tooltip heading color               |
| tipBorderRadius  | 	--pt-tip-border-radius | 	8px                            | 	Tooltip corner radius               |
| tipShadow        | 	--pt-tip-shadow        | 	0 10px 25px rgba(0, 0, 0, 0.2) | 	Tooltip drop shadow                 |
| tipMaxWidth      | 	--pt-tip-max-width     | 	360px                          | 	Maximum tooltip width               |
| buttonBgColor    | 	--pt-button-bg-color   | 	#2563eb                        | 	Primary button background           |
| buttonTextColor  | 	--pt-button-text-color | 	#ffffff                        | 	Primary button text color           |
| zIndex           | 	--pt-z-index           | 	9999                           | 	Stack order for overlay and tooltip |

7.2 Theme Export CLI (bin)

Expose a bin command in package.json ("perturbatio-dump-theme": "./bin/dump-theme.js"):

* Default output: Prints the default theme as formatted JSON to stdout.
* Optional file path: Writes directly to the specified path when provided.
* Optional format flag: --format json (default), --format js, or --format ts.

Examples

```bash
# Dump default theme to stdout (JSON)
npx perturbatio-dump-theme
# Dump default theme to a file (JS)
npx perturbatio-dump-theme -- ./my-theme.js --format js
# Dump default theme to a file (TS)
npx perturbatio-dump-theme -- ./my-theme.ts --format ts
```

8. Implementation Phases and Testing Plan

    * Phase 1 — Package & Tooling Setup:
        - Initialize Vite library build, TypeScript strict configuration, Tailwind CSS v4.3 (@tailwindcss/vite), and
          Vitest with jsdom.

    * Phase 2 — Core Engine & Persistence:
        - Implement Tour, TourManager, single-active-tour locking, section navigation, nextTour chaining, custom event
          listeners, and localStorage persistence.

    * Phase 3 — DOM Observer & Multi-Target Geometry:
        - Implement multi-selector bounding box calculation, scroll/resize listeners, MutationObserver grace period, and
          top-center fallback positioning.

    * Phase 4 — Svelte 5 UI Components:
        - Implement TourProvider.svelte, TourOverlay.svelte (SVG multi-cutout mask), and TourTooltip.svelte bound to CSS
          variables.

    * Phase 5 — CLI Theme Dump & Automated Tests:

        - Implement bin/dump-theme.js supporting stdout, file output, and json/js/ts formats.
        - Write Vitest suites covering auto-start suppression after close, resume from saved section, nextTour chaining,
          multi-element bounding boxes, grace period expiration, and theme CLI output.