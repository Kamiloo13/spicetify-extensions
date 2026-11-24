// Finds Spotify's lyrics elements without relying on hashed class names.
//
// Anchors that survive Spotify updates (verified on 1.3.10.2586):
//   - the lyrics container declares the lyrics colours as inline CSS variables: style="--lyrics-color-active: …"
//   - its first child is an empty <div> that paints Spotify's own background
//   - every lyric line is a <div dir="auto">; their common parent is the "host" we manage
//   - in cinema mode everything lives inside a direct child of `.Root__cinema-view` (a global, unhashed class)
//   - in the normal page view the scrollable page has a `.before-scroll-node` element (global, unhashed)

import { LineClasses } from "./LineClasses";

// Matches the variable *declaration* ("--lyrics-color-active: …"). Our own line styles only *use* the variable
// ("var(--lyrics-color-active)"), so lines are not mistaken for containers; managed lines are excluded as well.
const ContainerSelector = 'div[style*="--lyrics-color-active:"]:not([data-sbl-line])';
const LineSelector = 'div[dir="auto"]';
const CinemaViewSelector = ".Root__cinema-view";
const BeforeScrollNodeSelector = ".before-scroll-node";

/** How far up from the lyrics container we look for the page's `.before-scroll-node`. */
const MaxBackgroundSearchDepth = 10;

export interface LyricsElements {
    /** Element carrying the `--lyrics-color-*` variables. */
    container: HTMLElement;
    /** Spotify's own background layer (first empty child of the container). */
    spotifyBackground: HTMLElement | null;
    /** Direct parent of the lyric lines. */
    host: HTMLElement | null;
    /** Parent of the host - receives the width/font-size overrides. */
    content: HTMLElement | null;
    /** Cinema mode: direct child of `.Root__cinema-view` that holds the lyrics; null in the page view. */
    cinema: HTMLElement | null;
}

const area = (element: Element): number => {
    const rect = element.getBoundingClientRect();
    return rect.width * rect.height;
};

/** All elements that look like a lyrics container (page view, cinema mode, sidebar). */
export const findContainerCandidates = (): HTMLElement[] =>
    Array.from(document.querySelectorAll<HTMLElement>(ContainerSelector)).filter((element) => element instanceof HTMLDivElement);

/** The lyrics container we work with - the largest visible one (page/cinema lyrics beat the sidebar card). */
export const findLyricsContainer = (): HTMLElement | null => {
    const candidates = findContainerCandidates();
    if (candidates.length <= 1) return candidates[0] ?? null;

    let best: HTMLElement | null = null;
    let bestArea = -1;
    for (const candidate of candidates) {
        const candidateArea = area(candidate);
        if (candidateArea > bestArea) {
            best = candidate;
            bestArea = candidateArea;
        }
    }
    return best;
};

/** True for the lyric line elements inside the host. */
export const isLyricLine = (node: Node): node is HTMLDivElement =>
    node instanceof HTMLDivElement && (node.hasAttribute("dir") || LineClasses.matches(node, "Line"));

/** Lyric lines of the host, in document order. */
export const getLyricLines = (host: HTMLElement): HTMLDivElement[] => Array.from(host.children).filter(isLyricLine);

/** The element whose children are the lyric lines: the parent holding the most `dir="auto"` lines. */
export const findLyricsHost = (container: HTMLElement): HTMLElement | null => {
    const counts = new Map<HTMLElement, number>();
    for (const line of container.querySelectorAll<HTMLElement>(LineSelector)) {
        const parent = line.parentElement;
        if (parent) counts.set(parent, (counts.get(parent) ?? 0) + 1);
    }

    let host: HTMLElement | null = null;
    let best = 1; // A host needs at least two lines
    for (const [parent, count] of counts) {
        if (count > best) {
            host = parent;
            best = count;
        }
    }
    if (host) return host;

    // Fallback: a line class learned earlier (e.g. through the manual picker)
    for (const className of LineClasses.get("Line")) {
        const line = container.getElementsByClassName(className)[0];
        if (line?.parentElement) return line.parentElement;
    }
    return null;
};

/** Spotify's background layer: the first child of the container, if it is an empty <div>. */
const findSpotifyBackground = (container: HTMLElement): HTMLElement | null => {
    const first = container.firstElementChild;
    return first instanceof HTMLDivElement && first.childElementCount === 0 ? first : null;
};

/** Finds every lyrics-related element for the current view, or null if no lyrics are shown. */
export const findLyricsElements = (): LyricsElements | null => {
    const container = findLyricsContainer();
    if (!container) return null;

    const host = findLyricsHost(container);
    const content = host?.parentElement && host.parentElement !== container && container.contains(host.parentElement) ? host.parentElement : null;
    const cinema = container.closest<HTMLElement>(`${CinemaViewSelector} > *`);

    return { container, spotifyBackground: findSpotifyBackground(container), host, content, cinema };
};

/**
 * Page view: the page's `.before-scroll-node`, found from the nearest ancestor of the container that has one.
 * This is where the animated background goes outside of cinema mode.
 */
export const findPageBackgroundTarget = (container: HTMLElement): HTMLElement | null => {
    let ancestor = container.parentElement;
    for (let depth = 0; ancestor && depth < MaxBackgroundSearchDepth; depth++) {
        const target = ancestor.querySelector<HTMLElement>(BeforeScrollNodeSelector);
        if (target) return target;
        ancestor = ancestor.parentElement;
    }
    return null;
};

/**
 * Cinema mode: Spotify paints its gradient with empty layers next to the path from the cinema container down to
 * the lyrics container. Returns those empty siblings so they can be faded out behind our background.
 */
export const findCinemaBackdrops = (container: HTMLElement, cinema: HTMLElement): HTMLElement[] => {
    const backdrops: HTMLElement[] = [];
    let pathElement: HTMLElement | null = container;

    while (pathElement && pathElement !== cinema) {
        const parent: HTMLElement | null = pathElement.parentElement;
        if (!parent) break;

        for (const sibling of parent.children) {
            if (sibling !== pathElement && sibling instanceof HTMLDivElement && sibling.childElementCount === 0) backdrops.push(sibling);
        }
        pathElement = parent;
    }
    return backdrops;
};
