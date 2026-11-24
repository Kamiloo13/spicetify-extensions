// Tracks the cover art of the current track.

import { Log } from "../core/Log";
import { Scope } from "../core/Scope";
import { Signal } from "../core/Signal";

const RetryDelay = 100;
const MaxRetries = 15;

/** Spotify gives `spotify:image:<id>` URIs; the CDN URL works everywhere (including <img>). */
const toImageUrl = (uri: string | undefined): string | undefined => {
    if (!uri) return undefined;
    return uri.startsWith("spotify:image:") ? `https://i.scdn.co/image/${uri.slice("spotify:image:".length)}` : uri;
};

export class CoverArt {
    /** Fired with the new URL whenever the cover art changes. */
    readonly changed = new Signal<[string | undefined]>();

    private url: string | undefined;
    private retryTimer: ReturnType<typeof setTimeout> | undefined;

    constructor(scope: Scope) {
        const onSongChange = () => this.update();
        Spicetify.Player.addEventListener("songchange", onSongChange);
        scope.add(() => Spicetify.Player.removeEventListener("songchange", onSongChange));
        scope.add(() => clearTimeout(this.retryTimer));

        this.update();
    }

    /** URL of the current cover art (undefined if nothing is playing). */
    get current(): string | undefined {
        return this.url;
    }

    private update(retries = 0): void {
        clearTimeout(this.retryTimer);

        // Player data may not be ready right after startup or a song change
        const metadata = Spicetify.Player.data?.item?.metadata;
        if (!metadata) {
            if (retries < MaxRetries) this.retryTimer = setTimeout(() => this.update(retries + 1), RetryDelay);
            else Log.debug("No track metadata available - cover art not updated.");
            return;
        }

        // The image is heavily blurred, so the regular size is plenty
        const url = toImageUrl(metadata.image_url ?? metadata.image_large_url);
        if (url !== this.url) {
            this.url = url;
            this.changed.fire(url);
        }
    }
}
