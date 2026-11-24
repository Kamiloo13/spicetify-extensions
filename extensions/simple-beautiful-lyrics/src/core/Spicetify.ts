// Thin helpers around the Spicetify globals used by the extension.

const PollInterval = 100;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** True once every Spicetify API we depend on is available. */
const isReady = (): boolean =>
    typeof Spicetify !== "undefined" &&
    Spicetify.Player?.addEventListener !== undefined &&
    Spicetify.Platform !== undefined &&
    Spicetify.showNotification !== undefined;

/** Resolves once Spicetify finished loading its APIs. */
export const waitForSpicetify = async (): Promise<void> => {
    while (!isReady()) await sleep(PollInterval);
};

/** Spotify client version, e.g. "1.3.10.2586". */
export const getSpotifyVersion = (): string => (Spicetify.Platform as { version?: string } | undefined)?.version ?? "unknown";

/** Shows a short toast in the Spotify UI. */
export const notify = (message: string, isError = false, durationMs = 4000): void => {
    Spicetify.showNotification(message, isError, durationMs);
};
