<script lang="ts">
    import type { Snippet } from 'svelte';
    import { resolveTourNavControls, resolveTourNavLabels } from '../core/defaultTheme';
    import type {
        NavButtonActionContext,
        NavButtonContext,
        StepCounterContext,
        TargetBox,
        TooltipPlacement,
        TourNavControls,
        TourNavLabels,
        TourNavPlacement,
        TourSectionContent
    } from '../core/types';

    interface Props {
        content: TourSectionContent;
        placement: TooltipPlacement;
        anchorRect: TargetBox['rect'] | null;
        padding?: number;
        tourName?: string;
        sectionIndex: number;
        totalSections: number;
        canGoPrevious: boolean;
        canGoNext: boolean;
        hasNextTour: boolean;
        showRestartButton?: boolean;
        controls?: TourNavControls;
        allowAnimation?: boolean;
        extraClasses?: string;
        showNav?: boolean;
        navPlacement?: TourNavPlacement;
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
        content,
        placement,
        anchorRect,
        padding = 6,
        tourName = '',
        sectionIndex,
        totalSections,
        canGoPrevious,
        canGoNext,
        hasNextTour,
        showRestartButton,
        controls,
        allowAnimation = true,
        extraClasses = '',
        showNav,
        navPlacement = 'tooltip',
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
    const activeTourName = $derived(tourName || content.title || '');

    const shouldShowNav = $derived(
        showNav !== undefined ? showNav : navPlacement === 'tooltip'
    );

    const positionStyle = $derived.by(() => {
        if (placement === 'top-center' || !anchorRect) {
            return 'top: 24px; left: 50%; transform: translateX(-50%);';
        }

        const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const gap = padding + 12;

        const belowTop = anchorRect.bottom + gap;
        const spaceBelow = viewportHeight - belowTop;
        const spaceAbove = anchorRect.top - gap;

        const placeAbove = spaceBelow < 180 && spaceAbove > spaceBelow;
        const topPos = placeAbove ? Math.max(16, spaceAbove - 160) : Math.min(viewportHeight - 180, belowTop);
        let clampedLeft = Math.max(anchorRect.right, Math.min(anchorRect.left, viewportWidth - 376));

        // if the left pos + the width of the tooltip exceeds the viewport width, adjust it to fit
        if (clampedLeft + 360 > viewportWidth - 16) {
            clampedLeft = viewportWidth - 376;
        }

        return `top: ${Math.round(topPos)}px; left: ${Math.round(clampedLeft)}px;`;
    });

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

<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<section
        class="pt-tooltip {allowAnimation ? 'allow-animation' : ''} {extraClasses}"
        style={positionStyle}
        role="dialog"
        aria-modal="false"
        aria-label={content.title}
>
    <div class="pt-tooltip-header">
        <h2 class="pt-tooltip-title">{content.title}</h2>
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

    {#if content.content}
        <p class="pt-tooltip-body">{content.content}</p>
    {/if}

    {#if content.description}
        <p class="pt-tooltip-description">{content.description}</p>
    {/if}

    {#if shouldShowNav}
        <div class="pt-tooltip-footer">
            {#if resolvedControls.showStepCounter}
                {#if stepCounter}
                    {@render stepCounter(stepCounterContext)}
                {:else}
                    <span class="pt-step-counter">{sectionIndex + 1} / {totalSections}</span>
                {/if}
            {/if}

            <div class="pt-tooltip-actions">
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
            </div>
        </div>
    {/if}
</section>

<style>
    .pt-tooltip {
        position: fixed;
        z-index: calc(var(--pt-z-index, 9999) + 1);
        width: 100%;
        max-width: var(--pt-tip-max-width, 360px);
        padding: 16px;
        background-color: var(--pt-tip-bg-color, #ffffff);
        color: var(--pt-tip-text-color, #111827);
        border-radius: var(--pt-tip-border-radius, 8px);
        border: var(--pt-tip-border-width, 1px) solid var(--pt-tip-border-color, #e5e7eb);
        box-shadow: var(--pt-tip-shadow, 0 10px 25px rgba(0, 0, 0, 0.2));
    }

    .pt-tooltip.allow-animation {
        transition: left 0.25s ease, top 0.25s ease, opacity 0.2s ease, transform 0.2s ease;
    }

    .pt-tooltip-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 8px;
    }

    .pt-tooltip-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--pt-tip-title-color, #000000);
    }

    .pt-tooltip-body,
    .pt-tooltip-description {
        margin: 0 0 10px;
        font-size: 14px;
        line-height: 1.45;
    }

    .pt-tooltip-description {
        opacity: 0.85;
    }

    .pt-tooltip-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-top: 12px;
    }

    .pt-step-counter {
        font-size: 12px;
        opacity: 0.75;
    }

    .pt-tooltip-actions {
        display: flex;
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