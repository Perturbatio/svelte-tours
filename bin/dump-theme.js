#!/usr/bin/env node
/**
 * This script outputs the default theme configuration for @perturbatio/svelte-tours
 * It can output in JSON, JS, or TS format, and can write to a file or stdout
 *
 * Usage:
 * # Dump default theme to stdout (JSON)
 * npx perturbatio-dump-theme
 *
 * # Dump default theme to a file (JS)
 * npx perturbatio-dump-theme -- ./my-theme.js --format js
 *
 * # Dump default theme to a file (TS)
 * npx perturbatio-dump-theme -- ./my-theme.ts --format ts
 *
 * If outputPath is provided, the theme will be written to that file. Otherwise, it will be printed to stdout.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const DEFAULT_THEME = {
    maskBgColor: '#000000',
    maskTransparency: 0.6,
    highlightPadding: 6,
    highlightRadius: 6,
    tipBgColor: '#ffffff',
    tipTextColor: '#111827',
    tipTitleColor: '#000000',
    tipBorderRadius: '8px',
    tipShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    tipMaxWidth: '360px',
    buttonBgColor: '#2563eb',
    buttonTextColor: '#ffffff',
    zIndex: 9999
};

function parseArgs(argv) {
    let format = 'json';
    let outputPath = null;

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === '--format' && argv[i + 1]) {
            format = argv[i + 1].toLowerCase();
            i += 1;
        } else if (arg.startsWith('--format=')) {
            format = arg.slice('--format='.length).toLowerCase();
        } else if (!arg.startsWith('-') && outputPath === null) {
            outputPath = arg;
        }
    }

    return { format, outputPath };
}

function formatTheme(theme, format) {
    const jsonText = JSON.stringify(theme, null, 2);

    if (format === 'json') {
        return `${jsonText}\n`;
    }
    if (format === 'js') {
        return `export const tourTheme = ${jsonText};\n`;
    }
    if (format === 'ts') {
        return `import type { TourTheme } from '@perturbatio/svelte-tours/core';\n\nexport const tourTheme: TourTheme = ${jsonText};\n`;
    }

    throw new Error(`Unsupported format "${format}". Use json, js, or ts.`);
}

function main() {
    try {
        const { format, outputPath } = parseArgs(process.argv.slice(2));
        const content = formatTheme(DEFAULT_THEME, format);

        if (outputPath) {
            const fullPath = resolve(process.cwd(), outputPath);
            mkdirSync(dirname(fullPath), { recursive: true });
            writeFileSync(fullPath, content, 'utf8');
        } else {
            process.stdout.write(content);
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        process.stderr.write(`Error: ${message}\n`);
        process.exitCode = 1;
    }
}

main();