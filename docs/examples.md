
# Examples

This guide contains examples for `@perturbatio/svelte-tours`.

---

## 1. Simple Example: HTML Labels and Control Visibility

Use this example to:
- Show or hide specific navigation buttons.
- Render SVG icons or HTML markup inside button labels without extra Svelte code.

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { TourProvider, tours } from '@perturbatio/svelte-tours';

  onMount(() => {
    tours.addTour({
      name: 'simple-controls-tour',
      autoStart: true,
      // Enable restart button for the entire tour
      controls: {
        showRestart: true
      },
      // Use HTML markup and icons in labels
      labels: {
        previous: '<span>&larr;</span> Back',
        next: 'Next <span>&rarr;</span>',
        restart: '<span>&#x21bb;</span> Restart Tour'
      },
      sections: {
        welcomeStep: {
          elements: ['.welcome-box'],
          // Hide previous button on the first step
          controls: {
            showPrevious: false
          },
          content: {
            title: 'Welcome to the App',
            content: 'This step hides the Previous button and uses HTML labels.'
          }
        },
        actionStep: {
          elements: ['.main-action'],
          labels: {
            finish: '<strong>Finish &amp; Start</strong>'
          },
          content: {
            title: 'Main Feature',
            content: 'Click Finish when you complete this step.'
          }
        }
      }
    });
  });
</script>

<div class="page">
  <div class="welcome-box">Welcome Area</div>
  <button type="button" class="main-action">Get Started</button>
</div>

<TourProvider manager={tours} />
```

---

## 2. Substantial Example: Svelte 5 Snippets for Custom Buttons and UI

Use this example to:
- Render custom Svelte components (such as icons) inside default buttons.
- Replace button elements completely with your own design system components.
- Customize the step counter format.

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { TourProvider, tours, type TourTheme } from '@perturbatio/svelte-tours';

  const theme: Partial<TourTheme> = {
    maskBgColor: '#0f172a',
    maskTransparency: 0.65,
    buttonBgColor: '#0284c7',
    buttonTextColor: '#ffffff'
  };

  onMount(() => {
    tours.setTheme(theme);

    tours.addTour({
      name: 'custom-snippets-tour',
      autoStart: true,
      nextTour: 'advanced-features',
      controls: {
        showRestart: true,
        showStepCounter: true
      },
      sections: {
        header: {
          elements: ['.app-header'],
          content: {
            title: 'Application Navigation',
            content: 'Notice the custom icons, buttons, and step counter below.'
          }
        },
        search: {
          elements: ['.search-bar'],
          content: {
            title: 'Global Search',
            content: 'Type anywhere to search records.'
          }
        },
        finish: {
          elements: ['.profile-menu'],
          labels: {
            nextTour: 'Continue to Features'
          },
          content: {
            title: 'Account Settings',
            content: 'Manage your profile and preferences.'
          }
        }
      }
    });
  });
</script>

<!-- App UI -->
<div class="app-layout">
  <header class="app-header">Header</header>
  <input class="search-bar" placeholder="Search..." />
  <div class="profile-menu">Profile</div>
</div>

<!-- Tour Provider with Custom Svelte 5 Snippets -->
<TourProvider manager={tours}>
  <!-- Custom label snippet with dynamic icons -->
  {#snippet nextLabel({ label, isLastSection, hasNextTour })}
    <span class="btn-content">
      <span>{label}</span>
      {#if isLastSection && hasNextTour}
        <span class="icon">➔</span>
      {:else if isLastSection}
        <span class="icon">✓</span>
      {:else}
        <span class="icon">›</span>
      {/if}
    </span>
  {/snippet}

  <!-- Full replacement snippet for Previous button -->
  {#snippet prevButton({ label, onclick, disabled, class: className })}
    <button
      type="button"
      class="{className} custom-prev-btn"
      {onclick}
      {disabled}
      aria-label="Go to previous step"
    >
      ‹ {label}
    </button>
  {/snippet}

  <!-- Full replacement snippet for Step Counter -->
  {#snippet stepCounter({ sectionIndex, totalSections, tourName })}
    <div class="step-pill">
      <span class="tour-tag">{tourName}</span>
      <span class="step-badge">{sectionIndex + 1} / {totalSections}</span>
    </div>
  {/snippet}
</TourProvider>

<style>
  .btn-content {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .icon {
    font-weight: bold;
  }
  .custom-prev-btn {
    border-style: dashed;
  }
  .step-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
  }
  .tour-tag {
    text-transform: uppercase;
    font-size: 0.7rem;
    opacity: 0.7;
  }
  .step-badge {
    font-weight: 600;
  }
</style>
```

---

## 3. Dynamic Events and Fixed Top/Bottom Navigation

Use this example to:
- Move navigation into a fixed top or bottom bar.
- Wait for elements that render after an API call or user action (`targetGraceMs`).
- Start tours from browser events.

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { TourProvider, tours, type TourTheme } from '@perturbatio/svelte-tours';

  let showLatePanel = $state(false);

  const customTheme: Partial<TourTheme> = {
    maskBgColor: '#0f172a',
    maskTransparency: 0.65,
    highlightPadding: 8,
    highlightRadius: 8,
    tipBgColor: '#ffffff',
    tipTextColor: '#1e293b',
    tipTitleColor: '#0f172a',
    tipBorderRadius: '10px',
    buttonBgColor: '#0284c7',
    buttonTextColor: '#ffffff'
  };

  function openProfileTour(): void {
    window.dispatchEvent(new CustomEvent('open-profile-tour'));
  }

  function revealLatePanel(): void {
    showLatePanel = true;
  }

  function restartAllTours(): void {
    tours.restart('dashboard');
  }

  onMount(() => {
    tours.setTheme(customTheme);

    tours.addTour({
      name: 'userProfile',
      triggerEvent: 'open-profile-tour',
      targetGraceMs: 1200,
      showRestartButton: true,
      sections: {
        profileCard: {
          elements: ['.profile-card'],
          content: {
            title: 'User Profile',
            content: 'View and edit your account details here.',
            description: 'Started via the open-profile-tour event.'
          }
        },
        latePanel: {
          elements: ['.late-status-panel'],
          targetGraceMs: 1500,
          content: {
            title: 'Dynamic Panel',
            content: 'If this panel is not visible yet, the tour waits and then centers at the top.'
          }
        }
      }
    });

    tours.addTour({
      name: 'dashboard',
      autoStart: true,
      nextTour: 'userProfile',
      showRestartButton: true,
      navPlacement: 'bottom',
      labels: {
        next: 'Next',
        nextTour: 'Explore Profile',
        restart: 'Reset Dashboard'
      },
      sections: {
        welcome: {
          elements: ['.start-tour-btn'],
          content: {
            title: 'Welcome to the Dashboard',
            content: 'Use Previous and Next to move through sections, or Close to stop.'
          }
        },
        helpTargets: {
          elements: ['.header-help-btn', '.sidebar-help-btn'],
          navPlacement: 'top',
          labels: {
            prev: 'Go Back',
            nextTour: 'Proceed to Profile Tour'
          },
          content: {
            title: 'Help Controls',
            content: 'Both help buttons are highlighted. Elements between them stay masked.',
            description: 'The tooltip anchors to the first matching button with navigation in the top bar.'
          }
        }
      }
    });
  });
</script>

<div class="page-shell">
  <header class="top-bar">
    <button type="button" class="start-tour-btn" onclick={() => tours.start('dashboard')}>
      Start Dashboard Tour
    </button>

    <button type="button" class="header-help-btn">
      Header Help
    </button>

    <button type="button" onclick={openProfileTour}>
      Open Profile Tour (Event)
    </button>

    <button type="button" onclick={revealLatePanel}>
      Show Late Panel
    </button>

    <button type="button" onclick={restartAllTours}>
      Reset Dashboard Tour
    </button>
  </header>

  <div class="content-grid">
    <aside class="sidebar">
      <button type="button" class="sidebar-help-btn">
        Sidebar Help
      </button>
    </aside>

    <main class="main-area">
      <section class="profile-card">
        <h2>Profile Summary</h2>
        <p>Account status: Active</p>
      </section>

      {#if showLatePanel}
        <section class="late-status-panel">
          <h2>Late Status Panel</h2>
          <p>This panel appeared dynamically in the DOM.</p>
        </section>
      {/if}
    </main>
  </div>
</div>

<TourProvider manager={tours} />

<style>
  .page-shell {
    min-height: 100vh;
    padding: 20px;
    font-family: system-ui, sans-serif;
  }

  .top-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 24px;
  }

  .content-grid {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 24px;
  }

  .sidebar,
  .profile-card,
  .late-status-panel {
    padding: 16px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
  }
</style>
```

---

## 4. Vanilla JavaScript / TypeScript (Non-Svelte) Usage

Use `mountTourDom()` from `@perturbatio/svelte-tours/core` in projects without Svelte:

```ts
import { mountTourDom, tours } from '@perturbatio/svelte-tours/core';

// Mount the DOM overlay controller
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
  controls: {
    showRestart: true
  },
  labels: {
    previous: '&larr; Previous',
    next: 'Next &rarr;'
  },
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

// Call controller.destroy() when unmounting the UI
// controller.destroy();
```