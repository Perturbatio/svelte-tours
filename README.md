# `perturbatio-svelte-tours`

A lightweight tour engine and Svelte 5 component for interactive UI tours. It supports multi-element target masking, tour chaining (`nextTour`), `localStorage` state persistence, custom CSS variable themes, and non-Svelte DOM mounting.

## Features

* **Svelte 5 and plain TypeScript support:** Use `<TourProvider>` in Svelte 5 apps or `mountTourDom()` with `perturbatio-svelte-tours/core` in non-Svelte apps.
* **Single active tour:** Starting a tour stops any other active tour so only one tour runs at a time.
* **Multi-element cutouts:** Highlights each matching target element individually while keeping elements outside target boxes masked.
* **Flexible navigation placement:** Choose whether tour controls render inside the tooltip (`tooltip`, default) or in a fixed navigation bar at the top or bottom of the viewport (`top` or `bottom`), configurable globally, per tour, or per section.
* **Grace period and `top-center` fallback:** Waits a configurable time (`targetGraceMs`) for missing target elements, then centers the tooltip at the top of the screen if targets do not appear.
* **Persistence and resume:** Stores `dismissed`, `completed`, and `lastSectionKey` in `localStorage`. Closing an auto-started tour prevents future auto-starts until resumed explicitly or reset with `restart()`.
* **Tour chaining:** Set `nextTour` on a tour to move to another tour when clicking **Next** on the final section.
* **Theme customisation and CLI dump:** Configure styles through CSS custom properties (`--pt-*`) and export the default theme with `perturbatio-dump-theme`.

[//]: # (Installation instructions must stay near the top of the README)
## Installation

Install the package and its peer or build dependencies:

```bash
npm install perturbatio-svelte-tours
npm install -D svelte@^5.0.0 vite@^6.0.0 vitest@^3.0.0 tailwindcss@^4.3.0 @tailwindcss/vite@^4.3.0
```
Svelte 5 Usage

Mount <TourProvider> once in your root layout or page and register tours with tours.addTour(...):

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { TourProvider, tours } from 'perturbatio-svelte-tours';

  onMount(() => {
    tours.setTheme({
      maskBgColor: '#0f172a',
      maskTransparency: 0.65,
      buttonBgColor: '#2563eb'
    });

    tours.addTour({
      name: 'dashboard',
      autoStart: true,
      nextTour: 'profile',
      showRestartButton: true,
      sections: {
        intro: {
          elements: ['.start-intro-tour'],
          content: {
            title: 'Welcome',
            content: 'Use Previous and Next to move between sections.'
          }
        },
        helpInfo: {
          elements: ['.header-help-button', '.sidebar-help-button'],
          content: {
            title: 'Getting Help',
            description: 'Both help buttons are highlighted.'
          }
        }
      }
    });

    tours.addTour({
      name: 'profile',
      triggerEvent: 'open-profile-tour',
      sections: {
        overview: {
          elements: ['.profile-panel'],
          targetGraceMs: 1000,
          content: {
            title: 'Profile Tour',
            content: 'Started from nextTour or the open-profile-tour event.'
          }
        }
      }
    });
  });
</script>

<button type="button" class="start-intro-tour" onclick={() => tours.start('dashboard')}>
  Start Dashboard Tour
</button>

<TourProvider manager="{tours}"/>
```

### Navigation Placement (`navPlacement`)

By default, tour navigation buttons (`Previous`, `Next`, `Restart Tour`, `Close`, and step counter) render inside the tooltip body (`navPlacement: 'tooltip'`).

You can configure fixed navigation at the top or bottom of the screen by setting `navPlacement: 'top'` or `navPlacement: 'bottom'`:

```ts
// At tour level:
tours.addTour({
  name: 'dashboard',
  navPlacement: 'bottom', // 'tooltip' | 'top' | 'bottom'
  sections: {
    intro: {
      elements: ['.intro-header'],
      content: { title: 'Welcome' }
    },
    specialStep: {
      elements: ['.special-el'],
      navPlacement: 'top', // per-step override
      content: { title: 'Top Bar Navigation' }
    }
  }
});
```

When fixed navigation is active, `TourTooltip` automatically hides its internal footer buttons while displaying descriptions and step content cleanly near highlighted targets.

### Customisable Navigation Labels (`labels`)

Navigation button text and accessibility labels can be customised globally in theme, per tour, per section, or directly via component props (`<TourProvider>`, `<TourTooltip>`, and `<TourNavBar>`):

* `previous` (or `prev`) — Defaults to `'Previous'`
* `next` — Defaults to `'Next'`
* `nextTour` — Defaults to `'Next Tour'` (rendered on the final step when chained to another tour)
* `finish` (or `done`, `complete`) — Optional label for the next button on the final step
* `restart` (or `restartTour`) — Defaults to `'Restart Tour'`
* `close` — Defaults to `'Close'`
* `closeAriaLabel` — Defaults to `'Close tour'`
* `navAriaLabel` — Defaults to `'Tour navigation'`

```ts
// In theme:
tours.setTheme({
  labels: {
    previous: 'Back',
    next: 'Continue',
    restart: 'Start Over',
    close: 'Dismiss'
  }
});

// Or per tour / per section:
tours.addTour({
  name: 'dashboard',
  labels: {
    next: 'Next Step',
    nextTour: 'Go to Profile Tour'
  },
  sections: {
    welcome: {
      elements: ['.start-intro-tour'],
      content: { title: 'Welcome' }
    },
    finalSection: {
      elements: ['.action-btn'],
      labels: {
        finish: 'Get Started!'
      },
      content: { title: 'Finished' }
    }
  }
});
```

### Navigation Control Visibility (`controls`)

You can show or hide individual navigation controls. Configure controls in theme, per tour, per section, or on `<TourProvider>`:

* `showPrevious` (or `showPrev`) — Defaults to `true`
* `showNext` — Defaults to `true`
* `showClose` — Defaults to `true`
* `showRestart` (or `showRestartButton`) — Defaults to `false`
* `showStepCounter` (or `showCounter`) — Defaults to `true`

```ts
// Hide the previous button on the first section and show restart on the tour:
tours.addTour({
  name: 'onboarding',
  controls: {
    showRestart: true
  },
  sections: {
    step1: {
      elements: ['.hero'],
      controls: {
        showPrevious: false,
        showClose: false
      },
      content: { title: 'Step 1' }
    },
    step2: {
      elements: ['.feature'],
      content: { title: 'Step 2' }
    }
  }
});
```

### HTML in Button Labels

Default navigation buttons render HTML markup in label strings. You can insert SVG icons, badges, or styled text without extra templates:

```ts
tours.addTour({
  name: 'html-labels-tour',
  labels: {
    previous: '<span>&larr;</span> Back',
    next: 'Next <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>'
  },
  sections: {
    intro: {
      elements: ['.welcome-card'],
      content: { title: 'HTML Labels Demo' }
    }
  }
});
```

### Custom Snippets (Svelte 5)

Pass Svelte 5 snippets into `<TourProvider>`, `<TourTooltip>`, or `<TourNavBar>` to render custom components or replace buttons completely.

#### Inner Label Snippets
Use `prevLabel`, `nextLabel`, `closeLabel`, and `restartLabel` to replace the inner content of standard styled buttons:

```svelte
<TourProvider manager={tours}>
  {#snippet nextLabel({ label, isLastSection, hasNextTour })}
    <span>{label}</span>
    {#if isLastSection}
      <span class="badge">🚀</span>
    {:else}
      <span class="badge">→</span>
    {/if}
  {/snippet}
</TourProvider>
```

#### Full Button and Counter Snippets
Use `prevButton`, `nextButton`, `closeButton`, `restartButton`, and `stepCounter` to replace the entire button elements:

```svelte
<TourProvider manager={tours}>
  {#snippet nextButton({ label, onclick, disabled, class: btnClass })}
    <button type="button" class="{btnClass} custom-glow-button" {onclick} {disabled}>
      <strong>{label}</strong>
    </button>
  {/snippet}

  {#snippet stepCounter({ sectionIndex, totalSections })}
    <span class="pill-counter">Step {sectionIndex + 1} of {totalSections}</span>
  {/snippet}
</TourProvider>
```

Non-Svelte DOM Usage

For projects that do not use Svelte, import from perturbatio-svelte-tours/core and call mountTourDom():

```ts
import { mountTourDom, tours } from 'perturbatio-svelte-tours/core';

const controller = mountTourDom({
  container: document.body,
  manager: tours
});

tours.setTheme({
  maskBgColor: '#000000',
  maskTransparency: 0.6
});

tours.addTour({
  name: 'appTour',
  autoStart: true,
  sections: {
    step1: {
      elements: ['.action-button'],
      content: {
        title: 'Main Action',
        content: 'Click here to start your work.'
      }
    }
  }
});

// Call controller.destroy() when removing the tour UI.
```

Manager API Summary
* tours.setTheme(theme) — Applies custom theme values over defaults.
* tours.addTour(tourOrConfig) — Registers a Tour instance, TourConfig object, or JSON tour definition.
* tours.start(name, options?) — Starts a named tour and stops any active tour.
* tours.next() — Moves to the next section, or starts nextTour at the end of the tour.
* tours.previous() — Moves to the previous section in the active tour.
* tours.close() — Closes the tour, marks auto-start as dismissed, and saves lastSectionKey.
* tours.restart(name?) — Resets saved localStorage state for the tour and starts from the first section.

## Theme CLI (perturbatio-dump-theme)

The package provides the perturbatio-dump-theme CLI command to export the default theme configuration.

### Dump JSON to stdout (default):
```bash
npx perturbatio-dump-theme
```

### Dump JSON to a file:
```bash
npx perturbatio-dump-theme ./path/to/tour-theme.json
```
Choose json, js, or ts format:
```bash
npx perturbatio-dump-theme ./path/to/tour-theme.json --format json
npx perturbatio-dump-theme ./path/to/tour-theme.js --format js
npx perturbatio-dump-theme ./path/to/tour-theme.ts --format ts
```
