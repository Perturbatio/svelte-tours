<script lang="ts">
    /**
     * renders the semi-transparent overlay mask using an inline SVG <mask>
     * Each item in targets creates a separate cutout rectangle so
     * elements between or outside the targets stay masked
     */
    import type { TargetBox } from '../core/types';

    interface Props {
        targets: TargetBox[];
        padding?: number;
        radius?: number;
    }

    let { targets, padding = 6, radius = 6 }: Props = $props();

    const maskId = `pt-mask-${Math.random().toString(36).slice(2, 10)}`;

    const cutouts = $derived(
        targets.map((item) => {
            const left = item.rect.left - padding;
            const top = item.rect.top - padding;
            const width = Math.max(0, item.rect.width + padding * 2);
            const height = Math.max(0, item.rect.height + padding * 2);
            return {
                selector: item.selector,
                left,
                top,
                width,
                height
            };
        })
    );
</script>

<div class="pt-overlay" aria-hidden="true">
    <svg class="pt-overlay-svg">
        <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse">
                <rect x="0" y="0" width="100%" height="100%" fill="#ffffff" />
                {#each cutouts as box (box.selector + '-' + box.left + '-' + box.top)}
                    <rect
                            x={box.left}
                            y={box.top}
                            width={box.width}
                            height={box.height}
                            rx={radius}
                            ry={radius}
                            fill="#000000"
                    />
                {/each}
            </mask>
        </defs>
        <rect
                class="pt-mask-rect"
                x="0"
                y="0"
                width="100%"
                height="100%"
                mask={`url(#${maskId})`}
        />
    </svg>
</div>

<style>
    .pt-overlay {
        position: fixed;
        inset: 0;
        pointer-events: auto;
        z-index: var(--pt-z-index, 9999);
    }

    .pt-overlay-svg {
        display: block;
        width: 100vw;
        height: 100vh;
    }

    .pt-mask-rect {
        fill: var(--pt-mask-bg-color, #000000);
        fill-opacity: var(--pt-mask-transparency, 0.6);
    }
</style>