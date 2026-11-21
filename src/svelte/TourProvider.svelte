<script lang="ts">
    /**
     * Connects a TourManager instance (defaulting to tours) to TourOverlay and TourTooltip,
     * applies theme CSS variables, starts the grace-period target observer on each active
     * section change, and refreshes target positions on scroll and resize events.
     */
    import { untrack } from 'svelte';
    import { observeSectionTargets, type TargetObserverController } from '../core';
    import { tours as defaultManager, type TourManager } from '../core/TourManager';
    import type { ActiveSectionState, TourTheme } from '../core';
    import TourOverlay from './TourOverlay.svelte';
    import TourTooltip from './TourTooltip.svelte';
    import TourNavBar from './TourNavBar.svelte';

    interface Props {
        manager?: TourManager;
    }

    let { manager = defaultManager }: Props = $props();

    let activeState = $state<ActiveSectionState | null>(null);
    let currentTheme = $state<TourTheme>(defaultManager.getTheme());
    let cssVars = $state<Record<string, string>>({});
    let observerController: TargetObserverController | null = null;

    $effect.pre(() => {
        const mgr = manager;
        const unsubscribe = mgr.subscribe((nextState) => {
            activeState = nextState;
            currentTheme = mgr.getTheme();
            cssVars = mgr.getThemeCssVariables();
        });

        return () => {
            unsubscribe();
        };
    });

    const activeSectionId = $derived(
        activeState ? `${activeState.tourName}:${activeState.sectionKey}` : null
    );

    const cssVarsStyle = $derived(
        Object.entries(cssVars)
            .map(([key, value]) => `${key}: ${value}`)
            .join('; ')
    );

    function clearObserver(): void {
        if (observerController) {
            observerController.destroy();
            observerController = null;
        }
    }

    $effect(() => {
        if (!activeSectionId) {
            clearObserver();
            return;
        }

        const state = untrack(() => activeState);
        if (!state) {
            clearObserver();
            return;
        }

        clearObserver();

        const mgr = manager;
        const graceMs = mgr.getGracePeriodMs(state.section);
        observerController = observeSectionTargets(state.section.elements, {
            graceMs,
            onResolve: (result) => {
                mgr.setSectionTargets(result.targets, result.placement);
            }
        });

        const handleViewportChange = (): void => {
            observerController?.refresh();
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('resize', handleViewportChange, { passive: true });
            window.addEventListener('scroll', handleViewportChange, { passive: true, capture: true });
        }

        return () => {
            clearObserver();
            if (typeof window !== 'undefined') {
                window.removeEventListener('resize', handleViewportChange);
                window.removeEventListener('scroll', handleViewportChange, { capture: true });
            }
        };
    });
</script>

{#if activeState}
    <div class="pt-root" style={cssVarsStyle}>
        <TourOverlay
                targets={activeState.targets}
                padding={currentTheme.highlightPadding}
                radius={currentTheme.highlightRadius}
        />

        <TourTooltip
                content={activeState.section.content}
                placement={activeState.placement}
                anchorRect={activeState.anchorRect}
                padding={currentTheme.highlightPadding}
                sectionIndex={activeState.sectionIndex}
                totalSections={activeState.totalSections}
                canGoPrevious={activeState.canGoPrevious}
                canGoNext={activeState.canGoNext}
                hasNextTour={activeState.hasNextTour}
                showRestartButton={activeState.showRestartButton}
                navPlacement={activeState.navPlacement}
                onPrevious={() => manager.previous()}
                onNext={() => manager.next()}
                onClose={() => manager.close()}
                onRestart={() => manager.restart(activeState?.tourName)}
                extraClasses={currentTheme.tooltipExtraClasses}
        />

        {#if activeState.navPlacement === 'top' || activeState.navPlacement === 'bottom'}
            <TourNavBar
                    placement={activeState.navPlacement}
                    tourTitle={activeState.section.content.title}
                    sectionIndex={activeState.sectionIndex}
                    totalSections={activeState.totalSections}
                    canGoPrevious={activeState.canGoPrevious}
                    canGoNext={activeState.canGoNext}
                    hasNextTour={activeState.hasNextTour}
                    showRestartButton={activeState.showRestartButton}
                    onPrevious={() => manager.previous()}
                    onNext={() => manager.next()}
                    onClose={() => manager.close()}
                    onRestart={() => manager.restart(activeState?.tourName)}
            />
        {/if}
    </div>
{/if}

<style>
    .pt-root {
        position: relative;
    }
</style>