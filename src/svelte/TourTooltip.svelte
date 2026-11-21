<script lang="ts">
    import type { TargetBox, TooltipPlacement, TourSectionContent } from '../core/types';

    interface Props {
        content: TourSectionContent;
        placement: TooltipPlacement;
        anchorRect: TargetBox['rect'] | null;
        padding?: number;
        sectionIndex: number;
        totalSections: number;
        canGoPrevious: boolean;
        canGoNext: boolean;
        hasNextTour: boolean;
        showRestartButton: boolean;
        onPrevious: () => void;
        onNext: () => void;
        onClose: () => void;
        onRestart: () => void;
    }

    let {
        content,
        placement,
        anchorRect,
        padding = 6,
        sectionIndex,
        totalSections,
        canGoPrevious,
        canGoNext,
        hasNextTour,
        showRestartButton,
        onPrevious,
        onNext,
        onClose,
        onRestart
    }: Props = $props();

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
        const clampedLeft = Math.max(16, Math.min(anchorRect.left, viewportWidth - 376));

        return `top: ${Math.round(topPos)}px; left: ${Math.round(clampedLeft)}px;`;
    });

    const nextLabel = $derived(
        sectionIndex === totalSections - 1 && hasNextTour ? 'Next Tour' : 'Next'
    );
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<section
        class="pt-tooltip"
        style={positionStyle}
        role="dialog"
        aria-modal="false"
        aria-label={content.title}
>
    <div class="pt-tooltip-header">
        <h2 class="pt-tooltip-title">{content.title}</h2>
        <button
                type="button"
                class="pt-btn-close"
                onclick={onClose}
                aria-label="Close tour"
        >
            Close
        </button>
    </div>

    {#if content.content}
        <p class="pt-tooltip-body">{content.content}</p>
    {/if}

    {#if content.description}
        <p class="pt-tooltip-description">{content.description}</p>
    {/if}

    <div class="pt-tooltip-footer">
        <span class="pt-step-counter">{sectionIndex + 1} / {totalSections}</span>

        <div class="pt-tooltip-actions">
            {#if showRestartButton}
                <button
                        type="button"
                        class="pt-btn-secondary"
                        onclick={onRestart}
                >
                    Restart Tour
                </button>
            {/if}

            <button
                    type="button"
                    class="pt-btn-secondary"
                    onclick={onPrevious}
                    disabled={!canGoPrevious}
            >
                Previous
            </button>

            <button
                    type="button"
                    class="pt-btn-primary"
                    onclick={onNext}
                    disabled={!canGoNext}
            >
                {nextLabel}
            </button>
        </div>
    </div>
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
        box-shadow: var(--pt-tip-shadow, 0 10px 25px rgba(0, 0, 0, 0.2));
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