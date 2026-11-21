
Svelte Page:

```sveltehtml
<script lang="ts">
  import { onMount } from 'svelte';
  import { TourProvider, tours, type TourTheme } from '@perturbatio/svelte-tours';
  import { writable as $state } from 'svelte/store';

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

Without svelte:

```ts
import { mountTourDom, tours } from '@perturbatio/svelte-tours/core';

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

// TODO: Call controller.destroy() when removing the tour UI.
```

```ts
import { mountTourDom, tours } from '@perturbatio/svelte-tours/core';

const controller = mountTourDom();

tours.addTour({
  name: 'dashboard',
  autoStart: true,
  sections: {
    intro: {
      elements: ['.start-intro-tour'],
      content: { title: 'Welcome', content: 'Start here.' }
    }
  }
});

// Later, when cleaning up:
// controller.destroy();
```