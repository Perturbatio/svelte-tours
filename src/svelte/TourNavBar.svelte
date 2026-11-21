<script lang="ts">
    import { resolveTourNavLabels } from '../core/defaultTheme';
    import type { TourNavLabels, TourNavPlacement } from '../core/types';
    type scopedNavPlacement = 'top' | 'bottom';

    interface Props {
        // ensure nav placement can only be 'top' or 'bottom' for this component
        placement: scopedNavPlacement;
        tourTitle?: string;
        sectionIndex: number;
        totalSections: number;
        canGoPrevious: boolean;
        canGoNext: boolean;
        hasNextTour: boolean;
        showRestartButton: boolean;
        extraClasses?: string;
        labels?: TourNavLabels;
        onPrevious: () => void;
        onNext: () => void;
        onClose: () => void;
        onRestart: () => void;
    }

    let {
        placement = 'bottom',
        tourTitle = '',
        sectionIndex,
        totalSections,
        canGoPrevious,
        canGoNext,
        hasNextTour,
        showRestartButton,
        extraClasses = '',
        labels,
        onPrevious,
        onNext,
        onClose,
        onRestart
    }: Props = $props();

    const resolvedLabels = $derived(resolveTourNavLabels(labels));

    const nextLabel = $derived.by(() => {
        const isLast = sectionIndex === totalSections - 1;
        if (isLast && hasNextTour) {
            return resolvedLabels.nextTour;
        }
        if (isLast && !hasNextTour && resolvedLabels.finish) {
            return resolvedLabels.finish;
        }
        return resolvedLabels.next;
    });
</script>

<nav
        class="pt-navbar {placement ? `pt-navbar-placement-${placement}` : ''} {extraClasses}"
        aria-label={resolvedLabels.navAriaLabel}
>
    <div class="pt-navbar-actions">
        {#if showRestartButton}
            <button
                    type="button"
                    class="pt-btn-secondary"
                    onclick={onRestart}
            >
                {resolvedLabels.restart}
            </button>
        {/if}

        <button
                type="button"
                class="pt-btn-secondary"
                onclick={onPrevious}
                disabled={!canGoPrevious}
        >
            {resolvedLabels.previous}
        </button>

        <button
                type="button"
                class="pt-btn-primary"
                onclick={onNext}
                disabled={!canGoNext}
        >
            {nextLabel}
        </button>

        <button
                type="button"
                class="pt-btn-close"
                onclick={onClose}
                aria-label={resolvedLabels.closeAriaLabel}
        >
            {resolvedLabels.close}
        </button>
    </div>
    <div class="pt-navbar-left">
        {#if tourTitle}
            <span class="pt-navbar-title">{tourTitle}</span>
        {/if}
        <span class="pt-step-counter">{sectionIndex + 1} / {totalSections}</span>
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
