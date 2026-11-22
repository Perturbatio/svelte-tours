<script lang="ts">
    import type { Snippet } from 'svelte';
    import { resolveTourNavControls, resolveTourNavLabels } from '../core/defaultTheme';
    import type {
        NavButtonActionContext,
        NavButtonContext,
        StepCounterContext,
        TourNavControls,
        TourNavLabels
    } from '../core/types';
    type scopedNavPlacement = 'top' | 'bottom';

    interface Props {
        // ensure nav placement can only be 'top' or 'bottom' for this component
        placement: scopedNavPlacement;
        tourTitle?: string;
        tourName?: string;
        sectionIndex: number;
        totalSections: number;
        canGoPrevious: boolean;
        canGoNext: boolean;
        hasNextTour: boolean;
        showRestartButton?: boolean;
        showTourTitle?: boolean;
        showStepCounter?: boolean;
        controls?: TourNavControls;
        extraClasses?: string;
        labels?: TourNavLabels;
        onPrevious: () => void;
        onNext: () => void;
        onClose: () => void;
        onRestart: () => void;
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
        placement = 'bottom',
        tourTitle = '',
        tourName = '',
        sectionIndex,
        totalSections,
        canGoPrevious,
        canGoNext,
        hasNextTour,
        showRestartButton,
        showTourTitle,
        showStepCounter,
        controls,
        extraClasses = '',
        labels,
        onPrevious,
        onNext,
        onClose,
        onRestart,
        prevLabel,
        nextLabel: customNextLabel,
        closeLabel,
        restartLabel,
        prevButton,
        nextButton,
        closeButton,
        restartButton,
        stepCounter
    }: Props = $props();

    const resolvedLabels = $derived(resolveTourNavLabels(labels));
    const resolvedControls = $derived(
        resolveTourNavControls(
            showRestartButton !== undefined ? { showRestart: showRestartButton } : undefined,
            controls
        )
    );

    const isLastSection = $derived(sectionIndex === totalSections - 1);
    const activeTourName = $derived(tourName || tourTitle || '');

    const resolvedNextLabel = $derived.by(() => {
        if (isLastSection && hasNextTour) {
            return resolvedLabels.nextTour;
        }
        if (isLastSection && !hasNextTour && resolvedLabels.finish) {
            return resolvedLabels.finish;
        }
        return resolvedLabels.next;
    });

    const prevContext = $derived<NavButtonContext>({
        label: resolvedLabels.previous,
        disabled: !canGoPrevious,
        sectionIndex,
        totalSections,
        tourName: activeTourName,
        hasNextTour,
        isLastSection
    });
    const prevActionContext = $derived<NavButtonActionContext>({
        ...prevContext,
        onclick: onPrevious,
        class: 'pt-btn-secondary'
    });

    const nextContext = $derived<NavButtonContext>({
        label: resolvedNextLabel,
        disabled: !canGoNext,
        sectionIndex,
        totalSections,
        tourName: activeTourName,
        hasNextTour,
        isLastSection
    });
    const nextActionContext = $derived<NavButtonActionContext>({
        ...nextContext,
        onclick: onNext,
        class: 'pt-btn-primary'
    });

    const restartContext = $derived<NavButtonContext>({
        label: resolvedLabels.restart,
        disabled: false,
        sectionIndex,
        totalSections,
        tourName: activeTourName,
        hasNextTour,
        isLastSection
    });
    const restartActionContext = $derived<NavButtonActionContext>({
        ...restartContext,
        onclick: onRestart,
        class: 'pt-btn-secondary'
    });

    const closeContext = $derived<NavButtonContext>({
        label: resolvedLabels.close,
        disabled: false,
        sectionIndex,
        totalSections,
        tourName: activeTourName,
        hasNextTour,
        isLastSection
    });
    const closeActionContext = $derived<NavButtonActionContext>({
        ...closeContext,
        onclick: onClose,
        class: 'pt-btn-close',
        ariaLabel: resolvedLabels.closeAriaLabel
    });

    const stepCounterContext = $derived<StepCounterContext>({
        sectionIndex,
        totalSections,
        tourName: activeTourName
    });
</script>

<nav
        class="pt-navbar {placement ? `pt-navbar-placement-${placement}` : ''} {extraClasses}"
        aria-label={resolvedLabels.navAriaLabel}
>
    <div class="pt-navbar-actions">
        {#if resolvedControls.showRestart}
            {#if restartButton}
                {@render restartButton(restartActionContext)}
            {:else}
                <button
                        type="button"
                        class="pt-btn-secondary"
                        onclick={onRestart}
                >
                    {#if restartLabel}
                        {@render restartLabel(restartContext)}
                    {:else}
                        {@html resolvedLabels.restart}
                    {/if}
                </button>
            {/if}
        {/if}

        {#if resolvedControls.showPrevious}
            {#if prevButton}
                {@render prevButton(prevActionContext)}
            {:else}
                <button
                        type="button"
                        class="pt-btn-secondary"
                        onclick={onPrevious}
                        disabled={!canGoPrevious}
                >
                    {#if prevLabel}
                        {@render prevLabel(prevContext)}
                    {:else}
                        {@html resolvedLabels.previous}
                    {/if}
                </button>
            {/if}
        {/if}

        {#if resolvedControls.showNext}
            {#if nextButton}
                {@render nextButton(nextActionContext)}
            {:else}
                <button
                        type="button"
                        class="pt-btn-primary"
                        onclick={onNext}
                        disabled={!canGoNext}
                >
                    {#if customNextLabel}
                        {@render customNextLabel(nextContext)}
                    {:else}
                        {@html resolvedNextLabel}
                    {/if}
                </button>
            {/if}
        {/if}

        {#if resolvedControls.showClose}
            {#if closeButton}
                {@render closeButton(closeActionContext)}
            {:else}
                <button
                        type="button"
                        class="pt-btn-close"
                        onclick={onClose}
                        aria-label={resolvedLabels.closeAriaLabel}
                >
                    {#if closeLabel}
                        {@render closeLabel(closeContext)}
                    {:else}
                        {@html resolvedLabels.close}
                    {/if}
                </button>
            {/if}
        {/if}
    </div>
    <div class="pt-navbar-left">
        {#if tourTitle && resolvedControls.showTourTitle}
            {resolvedControls.showTourTitle ? 'showTourTitle is true' : 'showTourTitle is false'}
            <span class="pt-navbar-title">{tourTitle}</span>
        {/if}
        {#if resolvedControls.showStepCounter && showStepCounter}
            {#if stepCounter}
                {@render stepCounter(stepCounterContext)}
            {:else}
                <span class="pt-step-counter">{sectionIndex + 1} / {totalSections}</span>
            {/if}
        {/if}
    </div>

</nav>

<style>
    .pt-navbar {
        position: fixed;
        left: var(--pt-nav-left, auto);
        right: var(--pt-nav-right, auto);
        z-index: calc(var(--pt-z-index, 9999) + 2);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: var(--pt-nav-padding, 12px 24px);
        background-color: var(--pt-nav-bg-color, #ffffff);
        color: var(--pt-nav-text-color, #111827);
        border: var(--pt-nav-border-width, 1px) solid var(--pt-nav-border-color, #e5e7eb);
        box-shadow: var(--pt-tip-shadow, 0 10px 25px rgba(0, 0, 0, 0.2));
        box-sizing: border-box;
    }

    :global(.pt-navbar-placement-top) {
        top: 0;
        border-top: none;
        border-left: none;
        border-right: none;
    }

    :global(.pt-navbar-placement-bottom) {
        bottom: 0;
        border-bottom: none;
        border-left: none;
        border-right: none;
    }

    .pt-navbar-left {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .pt-navbar-title {
        font-weight: 600;
        font-size: 14px;
        color: var(--pt-tip-title-color, inherit);
    }

    .pt-step-counter {
        font-size: 13px;
        opacity: 0.75;
    }

    .pt-navbar-actions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
    }

    .pt-btn-primary,
    .pt-btn-secondary,
    .pt-btn-close {
        padding: 6px 12px;
        font-size: 13px;
        border-radius: 6px;
        cursor: pointer;
        border: 1px solid transparent;
        font-family: inherit;
    }

    .pt-btn-primary {
        background-color: var(--pt-button-bg-color, #2563eb);
        color: var(--pt-button-text-color, #ffffff);
    }

    .pt-btn-secondary,
    .pt-btn-close {
        background-color: transparent;
        color: inherit;
        border-color: currentColor;
    }

    button:disabled {
        opacity: 0.45;
        cursor: not-allowed;
    }
</style>
