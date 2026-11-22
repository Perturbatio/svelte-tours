<script lang="ts">
    /**
     * Connects a TourManager instance (defaulting to tours) to TourOverlay and TourTooltip,
     * applies theme CSS variables, starts the grace-period target observer on each active
     * section change, and refreshes target positions on scroll and resize events.
     */
    import { untrack, type Snippet } from 'svelte';
    import {
        observeSectionTargets,
        resolveTourNavControls,
        type ActiveSectionState,
        type NavButtonActionContext,
        type NavButtonContext,
        type StepCounterContext,
        type TargetObserverController,
        type TourNavControls,
        type TourNavLabels,
        type TourTheme
    } from '../core';
    import { tours as defaultManager, type TourManager } from '../core/TourManager';
    import TourOverlay from './TourOverlay.svelte';
    import TourTooltip from './TourTooltip.svelte';
    import TourNavBar from './TourNavBar.svelte';

    interface Props {
        manager?: TourManager;
        labels?: TourNavLabels;
        controls?: TourNavControls;
        // Svelte 5 Snippets
        prevLabel?: Snippet<[NavButtonContext]>;
        nextLabel?: Snippet<[NavButtonContext]>;
        closeLabel?: Snippet<[NavButtonContext]>;
        restartLabel?: Snippet<[NavButtonContext]>;
        prevButton?: Snippet<[NavButtonActionContext]>;
        nextButton?: Snippet<[NavButtonActionContext]>;
        closeButton?: Snippet<[NavButtonActionContext]>;
        restartButton?: Snippet<[NavButtonActionContext]>;
        stepCounter?: Snippet<[StepCounterContext]>;
    }

    let {
        manager = defaultManager,
        labels: customLabels,
        controls: customControls,
        prevLabel,
        nextLabel,
        closeLabel,
        restartLabel,
        prevButton,
        nextButton,
        closeButton,
        restartButton,
        stepCounter
    }: Props = $props();

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
        activeState ? `${activeState.tourName}:${activeState.sectionKey}:${activeState.stepId}` : null
    );

    const cssVarsStyle = $derived(
        Object.entries(cssVars)
            .map(([key, value]) => `${key}: ${value}`)
            .join('; ')
    );

    const effectiveControls = $derived(
        activeState
            ? customControls
                ? resolveTourNavControls(activeState.controls, customControls)
                : activeState.controls
            : undefined
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
                tourName={activeState.tourName}
                sectionIndex={activeState.sectionIndex}
                totalSections={activeState.totalSections}
                canGoPrevious={activeState.canGoPrevious}
                canGoNext={activeState.canGoNext}
                hasNextTour={activeState.hasNextTour}
                showRestartButton={activeState.showRestartButton}
                controls={effectiveControls}
                navPlacement={activeState.navPlacement}
                labels={customLabels ? { ...activeState.labels, ...customLabels } : activeState.labels}
                onPrevious={() => manager.previous()}
                onNext={() => manager.next()}
                onClose={() => manager.close()}
                onRestart={() => manager.restart(activeState?.tourName)}
                extraClasses={currentTheme.tooltipExtraClasses}
                {prevLabel}
                {nextLabel}
                {closeLabel}
                {restartLabel}
                {prevButton}
                {nextButton}
                {closeButton}
                {restartButton}
                {stepCounter}
        />

        {#if activeState.navPlacement === 'top' || activeState.navPlacement === 'bottom'}
            <TourNavBar
                    placement={activeState.navPlacement}
                    tourTitle={activeState.section.content.title}
                    tourName={activeState.tourName}
                    sectionIndex={activeState.sectionIndex}
                    totalSections={activeState.totalSections}
                    canGoPrevious={activeState.canGoPrevious}
                    canGoNext={activeState.canGoNext}
                    hasNextTour={activeState.hasNextTour}
                    showRestartButton={activeState.showRestartButton}
                    controls={effectiveControls}
                    labels={customLabels ? { ...activeState.labels, ...customLabels } : activeState.labels}
                    onPrevious={() => manager.previous()}
                    onNext={() => manager.next()}
                    onClose={() => manager.close()}
                    onRestart={() => manager.restart(activeState?.tourName)}
                    {prevLabel}
                    {nextLabel}
                    {closeLabel}
                    {restartLabel}
                    {prevButton}
                    {nextButton}
                    {closeButton}
                    {restartButton}
                    {stepCounter}
            />
        {/if}
    </div>
{/if}

<style>
    .pt-root {
        position: relative;
    }
</style>