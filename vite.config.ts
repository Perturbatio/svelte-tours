import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [svelte(), tailwindcss()],
    resolve: {
        conditions: process.env.VITEST ? ['browser'] : []
    },
    build: {
        emptyOutDir: false,
        lib: {
            entry: {
                index: resolve(import.meta.dirname, 'src/index.ts'),
                'core/index': resolve(import.meta.dirname, 'src/core/index.ts')
            },
            formats: ['es']
        },
        rollupOptions: {
            external: ['svelte', /^svelte\/.*/]
        }
    },
    test: {
        setupFiles: ['src/test/setup.ts'],
        environment: 'jsdom',
        include: ['tests/**/*.test.ts'],
        globals: true,
        // Component tests need a DOM environment; unit tests use // @vitest-environment node
        // directive at the top of their files to stay in Node.
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: ['src/**/*.{ts,svelte}'],
            exclude: [
                'src/**/*.d.ts',
                'src/test/**'
            ]
        },
        maxWorkers: 12,
        testTimeout: 6000, // just a little longer than the default 5000ms
    },
});