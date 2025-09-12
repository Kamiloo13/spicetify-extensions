// Initial Services
// Comment this out in case of building the "local" version
import { HasDevInstance } from "./services/Session";
import { GlobalCleanup, IsSpicetifyLoaded } from "./services/Session";
import { Start as StartCoverArt } from "./services/CoverArt";
import { Start as StartCheckLyrics, CheckForLyricsContainers } from "./modules/LyricsContainer";
// import { Start as StartCheckContribute, CheckForContributeContainer } from "./modules/LyricsContribute";
import { CheckForLiveBackgrounds } from "./modules/LyricsBackground";
import { SettingsSection } from "./modules/SettingsSection";
import Player from "./services/Player";
import { toggleFetchOverride, clearLyricsCache } from "./services/FetchOv";
import { setLogEnabled } from "./services/Logger";
import Spotify from "./services/Spotify";

const DEFAULT_API_ENDPOINT = "https://lyrics.kamiloo13.me/api";
const URL_REGEX = /^https?:\/\/([\w-]+(\.[\w-]+)+|localhost)(:[0-9]{1,5})?(\/[^\s\?]*)?$/;
const CacheVersion = "1";

async function main() {
    // Comment this out in development mode or when using the local version
    if (HasDevInstance) return;

    const settings = new SettingsSection("Simple Beautiful Lyrics", "simple-beautiful-lyrics");

    const endpoint = settings.getFieldValue("api-endpoint") as string;
    if (URL_REGEX.test(endpoint)) {
        settings.setFieldValue("api-input-endpoint", endpoint);
    } else {
        settings.setFieldValue("api-endpoint", DEFAULT_API_ENDPOINT);
        settings.setFieldValue("api-input-endpoint", DEFAULT_API_ENDPOINT);
    }

    // Add settings
    settings.addToggle("override-fetch", "Override Spotify's 'fetch' function to enable searching for alternative lyric sources (app refresh recommended)", true, () => {
        const fetchOverrideToggle = Boolean(settings.getFieldValue("override-fetch"));
        toggleFetchOverride(fetchOverrideToggle);
    });
    settings.addInput("api-input-endpoint", `API Endpoint (default: ${DEFAULT_API_ENDPOINT})`, DEFAULT_API_ENDPOINT, () => {}, "text", {
        onBlur: (e) => {
            const endpoint = e.target.value;

            if (endpoint.length > 4 && endpoint === settings.getFieldValue("api-endpoint")) return;

            if (!URL_REGEX.test(endpoint)) {
                e.target.value = DEFAULT_API_ENDPOINT;

                settings.setFieldValue("api-endpoint", DEFAULT_API_ENDPOINT);
                settings.setFieldValue("api-input-endpoint", endpoint);

                Spicetify.showNotification("Invalid API Endpoint. Default value restored.");
                return;
            }

            settings.setFieldValue("api-endpoint", endpoint);
            Spicetify.showNotification("API Endpoint saved!");
        }
    });
    settings.addHidden("api-token", "");
    settings.addInput("api-token-input", "API Token (optional)", "", () => {}, "text", {
        onBlur: (e) => {
            const token = e.target.value;
            if (token === settings.getFieldValue("api-token")) return;
            settings.setFieldValue("api-token", token);
            Spicetify.showNotification("API Token saved!");
        }
    });
    settings.addToggle("enable-debug", "Enable debug logging", false, () => {
        setLogEnabled(Boolean(settings.getFieldValue("enable-debug")));
    });
    settings.addButton("clear-cache", "Clear Lyrics Cache", "Clear", () => {
        clearLyricsCache();
        Spicetify.showNotification("Lyrics cache cleared!");
    });
    settings.pushSettings();

    // Check if cache version is up to date
    const cacheVersion = settings.getFieldValue("cache-version");
    if (cacheVersion !== CacheVersion) {
        settings.setFieldValue("cache-version", CacheVersion);
        clearLyricsCache();
    }

    // Read settings
    setLogEnabled(Boolean(settings.getFieldValue("enable-debug")));
    toggleFetchOverride(Boolean(settings.getFieldValue("override-fetch")));

    while (!IsSpicetifyLoaded()) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    StartCoverArt();
    Player.Start();

    const observer = GlobalCleanup.AddObserver(
        new MutationObserver(() => {
            const mainLyricsContainers = Spotify.getComponents<HTMLDivElement>("MainLyricsContainerClass", document.body);

            const mainLyricsContainer = mainLyricsContainers.length == 1 ? mainLyricsContainers[0] : mainLyricsContainers.length > 1 ? mainLyricsContainers[1] : null;
            CheckForLiveBackgrounds(mainLyricsContainer);
            CheckForLyricsContainers(mainLyricsContainer);
            // CheckForContributeContainer(mainLyricsContainer);
        })
    );

    observer.observe(document.body, { attributes: false, childList: true, subtree: true });

    // Check for initial elements
    const mainLyricsContainers = Spotify.getComponents<HTMLDivElement>("MainLyricsContainerClass", document.body);
    const mainLyricsContainer = mainLyricsContainers.length == 1 ? mainLyricsContainers[0] : mainLyricsContainers.length > 1 ? mainLyricsContainers[1] : null;
    CheckForLiveBackgrounds(mainLyricsContainer);
    // CheckForContributeContainer(mainLyricsContainer);
    // StartCheckContribute(mainLyricsContainer);
    StartCheckLyrics(mainLyricsContainer);
}

export default main;
