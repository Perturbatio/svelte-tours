<script lang="ts">
    import { TourProvider } from '../../src';
    import type { TourManager } from '../../src';

    interface Props {
        manager: TourManager;
        useInnerSnippets?: boolean;
        useButtonSnippets?: boolean;
    }

    let { manager, useInnerSnippets = false, useButtonSnippets = false }: Props = $props();
</script>

{#if useInnerSnippets}
    <TourProvider {manager}>
        {#snippet nextLabel(ctx)}
            <span class="custom-next-label">Custom Next ({ctx.sectionIndex + 1}/{ctx.totalSections})</span>
        {/snippet}
        {#snippet prevLabel(ctx)}
            <span class="custom-prev-label">Custom Prev (disabled: {ctx.disabled})</span>
        {/snippet}
        {#snippet closeLabel(ctx)}
            <span class="custom-close-label">Custom Close</span>
        {/snippet}
        {#snippet restartLabel(ctx)}
            <span class="custom-restart-label">Custom Restart</span>
        {/snippet}
        {#snippet stepCounter(ctx)}
            <span class="custom-step-counter">Step {ctx.sectionIndex + 1} of {ctx.totalSections} in {ctx.tourName}</span>
        {/snippet}
    </TourProvider>
{:else if useButtonSnippets}
    <TourProvider {manager}>
        {#snippet nextButton(ctx)}
            <button type="button" class="custom-next-btn" onclick={ctx.onclick} disabled={ctx.disabled}>
                Custom Next Btn: {ctx.label}
            </button>
        {/snippet}
        {#snippet prevButton(ctx)}
            <button type="button" class="custom-prev-btn" onclick={ctx.onclick} disabled={ctx.disabled}>
                Custom Prev Btn: {ctx.label}
            </button>
        {/snippet}
        {#snippet closeButton(ctx)}
            <button type="button" class="custom-close-btn" onclick={ctx.onclick} aria-label={ctx.ariaLabel}>
                Custom Close Btn
            </button>
        {/snippet}
        {#snippet restartButton(ctx)}
            <button type="button" class="custom-restart-btn" onclick={ctx.onclick}>
                Custom Restart Btn
            </button>
        {/snippet}
    </TourProvider>
{:else}
    <TourProvider {manager} />
{/if}
