// Visual effects on the lyric lines:
//   - lines are drawn with a text-shadow instead of a fill, which lets us blur them;
//   - lines further from the active one get more blur;
//   - the active line is slightly larger.
// Every managed line is tagged with `data-sbl-line` and `data-sbl-state` so the stylesheet can target it
// without knowing Spotify's class names.

import { Scope } from "../core/Scope";
import { getLyricLines } from "../dom/Detection";
import { LyricState, resolveLineStates } from "../dom/LineStates";

import "../styles/lyrics.scss";

/** Lines this many lines (or more) away from the active one get the maximum blur (in px). */
const MaxBlurDistance = 4;
/** How much larger the active line is, in rem (Spotify sizes lyrics in rem). */
const ActiveSizeIncrease = 0.5;
/** Wait for resizing to settle before measuring the font size again. */
const ResizeSettleDelay = 250;

const LineAttribute = "data-sbl-line";
const StateAttribute = "data-sbl-state";
const ContentAttribute = "data-sbl-content";

interface RenderInfo {
    lineCount: number;
    activeIndex: number;
    states: Partial<Record<LyricState, number>>;
}

export class LyricsEffects {
    private readonly scope: Scope;
    private host: HTMLElement | null = null;
    private content: HTMLElement | null = null;
    private fontSizeRem = 0;
    /** Inline style we last wrote to each line - avoids touching lines that did not change. */
    private applied = new WeakMap<HTMLElement, string>();
    private managed = new Set<HTMLElement>();
    private lastRender: RenderInfo = { lineCount: 0, activeIndex: -1, states: {} };

    constructor(parent: Scope) {
        this.scope = parent.child("lyrics");
        this.scope.add(() => this.markContent(null));
    }

    /**
     * Starts managing `host` (the parent of the lyric lines) and marks `content` (the wrapper that receives
     * the width/font-size overrides). Passing null stops.
     */
    update(host: HTMLElement | null, content: HTMLElement | null): void {
        this.markContent(content);
        if (host === this.host && (host === null || host.isConnected)) return;
        this.attach(host);
    }

    /** Re-renders the current lines (e.g. after the line classes were reset). */
    refresh(): void {
        if (this.host) this.render();
    }

    /** Diagnostics: what the last render saw. */
    describe() {
        return { managing: this.host !== null, fontSizeRem: this.fontSizeRem, ...this.lastRender };
    }

    private attach(host: HTMLElement | null): void {
        const scope = this.scope.child("host");
        this.host = host;
        this.lastRender = { lineCount: 0, activeIndex: -1, states: {} };
        if (!host) return;

        // Spotify swaps line elements when their state changes, so watch the children and their classes.
        // Our own changes (style, data-* attributes) are not observed, so this cannot loop.
        scope.observer(new MutationObserver(() => this.render())).observe(host, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["class"]
        });

        let resizeTimer: ReturnType<typeof setTimeout> | undefined;
        scope.observer(
            new ResizeObserver(() => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    this.measureFontSize();
                    this.render();
                }, ResizeSettleDelay);
            })
        ).observe(host);
        scope.add(() => clearTimeout(resizeTimer));

        scope.add(() => this.restoreLines());

        this.measureFontSize();
        this.render();
    }

    private measureFontSize(): void {
        if (!this.host) return;
        const hostSize = parseFloat(getComputedStyle(this.host).fontSize);
        const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        if (hostSize > 0 && rootSize > 0) this.fontSizeRem = hostSize / rootSize;
    }

    private render(): void {
        if (!this.host) return;

        const lines = getLyricLines(this.host);
        const { states, activeIndex } = resolveLineStates(lines);
        const counts: Partial<Record<LyricState, number>> = {};

        lines.forEach((line, index) => {
            const state = states[index];
            counts[state] = (counts[state] ?? 0) + 1;

            const style = this.styleFor(state, index, activeIndex);
            if (this.applied.get(line) !== style) {
                line.style.cssText = style;
                this.applied.set(line, style);
            }

            const stateValue = state.toLowerCase();
            if (line.getAttribute(StateAttribute) !== stateValue) line.setAttribute(StateAttribute, stateValue);
            if (!line.hasAttribute(LineAttribute)) line.setAttribute(LineAttribute, "");
            this.managed.add(line);
        });

        // Forget lines that are gone
        for (const line of this.managed) {
            if (!line.isConnected) this.managed.delete(line);
        }

        this.lastRender = { lineCount: lines.length, activeIndex, states: counts };
    }

    private styleFor(state: LyricState, index: number, activeIndex: number): string {
        const focused = state === "Active" || state === "Unsynced";

        // No blur for focused lines, and none at all until the song is past its first lines
        const blur = focused || activeIndex <= 1 ? 0 : Math.min(Math.abs(index - activeIndex), MaxBlurDistance);

        const color = focused ? "var(--lyrics-color-active)" : state === "Sung" ? "var(--lyrics-color-passed)" : "var(--lyrics-color-inactive)";
        const fontSize = state === "Active" && this.fontSizeRem > 0 ? ` font-size: ${this.fontSizeRem + ActiveSizeIncrease}rem;` : "";

        return `color: transparent; text-shadow: 0 0 ${blur}px ${color};${fontSize}`;
    }

    private markContent(element: HTMLElement | null): void {
        if (element === this.content) return;
        this.content?.removeAttribute(ContentAttribute);
        element?.setAttribute(ContentAttribute, "");
        this.content = element;
    }

    /** Removes everything we added to the lines. */
    private restoreLines(): void {
        for (const line of this.managed) {
            if (this.applied.has(line)) line.style.cssText = "";
            line.removeAttribute(LineAttribute);
            line.removeAttribute(StateAttribute);
        }
        this.managed.clear();
        this.applied = new WeakMap();
    }
}
