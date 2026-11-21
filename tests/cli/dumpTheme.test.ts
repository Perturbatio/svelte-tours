import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const CLI_PATH = resolve(process.cwd(), 'bin/dump-theme.js');

describe('perturbatio-dump-theme CLI', () => {
    const tempDirs: string[] = [];

    afterEach(() => {
        while (tempDirs.length > 0) {
            const dir = tempDirs.pop()!;
            rmSync(dir, { recursive: true, force: true });
        }
    });

    it('dumps default theme as JSON to stdout when no path is given', () => {
        const stdout = execFileSync(process.execPath, [CLI_PATH], { encoding: 'utf8' });
        const parsed = JSON.parse(stdout);
        expect(parsed.maskBgColor).toBe('#000000');
        expect(parsed.maskTransparency).toBe(0.6);
    });

    it('writes theme to a file when a file path argument is given', () => {
        const dir = mkdtempSync(join(tmpdir(), 'pt-theme-'));
        tempDirs.push(dir);
        const outFile = join(dir, 'theme.json');

        execFileSync(process.execPath, [CLI_PATH, outFile], { encoding: 'utf8' });
        expect(existsSync(outFile)).toBe(true);

        const parsed = JSON.parse(readFileSync(outFile, 'utf8'));
        expect(parsed.tipMaxWidth).toBe('360px');
    });

    it('supports --format ts and --format js flags', () => {
        const tsOutput = execFileSync(process.execPath, [CLI_PATH, '--format', 'ts'], {
            encoding: 'utf8'
        });
        expect(tsOutput).toContain('export const tourTheme: TourTheme =');

        const jsOutput = execFileSync(process.execPath, [CLI_PATH, '--format=js'], {
            encoding: 'utf8'
        });
        expect(jsOutput).toContain('export const tourTheme =');
    });
});