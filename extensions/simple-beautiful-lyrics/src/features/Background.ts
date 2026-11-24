// Animated background built from the blurred cover art (inspired by Apple Music).
//
// Page view:   the layers are added to the page's `.before-scroll-node`.
// Cinema mode: a new element holding the layers is prepended to the cinema container, and Spotify's own
//              gradient layers are faded out (data-sbl-fade).
// In both cases Spotify's own background layer inside the lyrics container is made transparent
// (data-sbl-spotify-background) so our background shows through.

import { Scope } from "../core/Scope";
import { findCinemaBackdrops, findPageBackgroundTarget, LyricsElements } from "../dom/Detection";
import { CoverArt } from "./CoverArt";

import "../styles/background.scss";

const HostClass = "sbl-background-host";
const LayersClass = "sbl-background";
const LayerClasses = ["sbl-background-color", "sbl-background-back", "sbl-background-back-center"];

const SpotifyBackgroundAttribute = "data-sbl-spotify-background";
const FadeAttribute = "data-sbl-fade";

interface Target {
    /** Element the layers are attached to (before-scroll-node or the cinema container). */
    element: HTMLElement;
    cinema: boolean;
}

export class Background {
    private readonly scope: Scope;
    private target: HTMLElement | null = null;
    private layers: HTMLDivElement | null = null;
    private images: HTMLImageElement[] = [];
    private spotifyBackground: HTMLElement | null = null;
    private faded = new Set<HTMLElement>();

    constructor(
        parent: Scope,
        private readonly coverArt: CoverArt
    ) {
        this.scope = parent.child("background");
        this.scope.add(this.coverArt.changed.connect((url) => this.setImage(url)));
        this.scope.add(() => {
            this.markSpotifyBackground(null);
            this.updateFadedBackdrops([]);
        });
    }

    /** Re-evaluates the background for the currently detected lyrics elements (null = no lyrics shown). */
    update(elements: LyricsElements | null): void {
        this.markSpotifyBackground(elements?.spotifyBackground ?? null);
        this.updateFadedBackdrops(elements?.cinema ? findCinemaBackdrops(elements.container, elements.cinema) : []);

        const target = elements ? this.resolveTarget(elements) : null;
        const unchanged = (target?.element ?? null) === this.target && (target === null || this.layers?.isConnected === true);
        if (unchanged) return;

        this.attach(target);
    }

    /** Diagnostics: where the background currently lives. */
    describe() {
        return {
            attached: this.layers?.isConnected ?? false,
            mode: this.target === null ? "none" : this.layers?.parentElement === this.target ? "page" : "cinema",
            spotifyBackgroundMarked: this.spotifyBackground !== null,
            fadedBackdrops: this.faded.size
        };
    }

    private resolveTarget(elements: LyricsElements): Target | null {
        if (elements.cinema) return { element: elements.cinema, cinema: true };
        const page = findPageBackgroundTarget(elements.container);
        return page ? { element: page, cinema: false } : null;
    }

    private attach(target: Target | null): void {
        const scope = this.scope.child("target");
        this.target = target?.element ?? null;
        this.layers = null;
        this.images = [];
        if (!target) return;

        // Cinema mode gets its own wrapper element, the page view reuses `.before-scroll-node`
        const host = target.cinema ? scope.element(document.createElement("div")) : target.element;
        if (target.cinema) target.element.prepend(host);

        // React may rewrite the class attribute - keep our class on it
        const ensureHostClass = () => {
            if (!host.classList.contains(HostClass)) host.classList.add(HostClass);
        };
        ensureHostClass();
        scope.observer(new MutationObserver(ensureHostClass)).observe(host, { attributes: true, attributeFilter: ["class"] });
        scope.add(() => host.classList.remove(HostClass));

        // Layers: three blurred, rotating copies of the cover art
        const layers = scope.element(document.createElement("div"));
        layers.classList.add(LayersClass);
        for (const layerClass of LayerClasses) {
            const image = document.createElement("img");
            image.classList.add(layerClass);
            image.alt = "";
            layers.appendChild(image);
            this.images.push(image);
        }
        host.prepend(layers);
        this.layers = layers;

        this.setImage(this.coverArt.current);
    }

    private setImage(url: string | undefined): void {
        for (const image of this.images) {
            if (url) image.src = url;
            else image.removeAttribute("src");
        }
    }

    private markSpotifyBackground(element: HTMLElement | null): void {
        if (element === this.spotifyBackground) return;
        this.spotifyBackground?.removeAttribute(SpotifyBackgroundAttribute);
        element?.setAttribute(SpotifyBackgroundAttribute, "");
        this.spotifyBackground = element;
    }

    private updateFadedBackdrops(elements: HTMLElement[]): void {
        const next = new Set(elements);
        for (const element of this.faded) {
            if (!next.has(element)) element.removeAttribute(FadeAttribute);
        }
        for (const element of next) {
            if (!element.hasAttribute(FadeAttribute)) element.setAttribute(FadeAttribute, "");
        }
        this.faded = next;
    }
}
