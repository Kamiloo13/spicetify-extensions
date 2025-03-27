// Initial Services
import { GlobalCleanup, HasDevInstance, IsSpicetifyLoaded } from "./services/Session";
import { Start as StartCoverArt } from "./services/CoverArt";
import { Start as StartCheckLyrics, CheckForLyricsContainers } from "./modules/LyricsContainer";
// import { Start as StartCheckContribute, CheckForContributeContainer } from "./modules/LyricsContribute";
import { CheckForLiveBackgrounds } from "./modules/LyricsBackground";
import { SettingsSection } from "./modules/SettingsSection";
import Player from "./services/Player";
import { toggleFetchOverride, clearLyricsCache, setAPIEndpoint } from "./services/FetchOv";
import { setLogEnabled } from "./services/Logger";
import Spotify from "./services/Spotify";

const DEFAULT_API_ENDPOINT = "https://lyrics.kamiloo13.me/api";

async function main() {
    // Comment this out in development mode
    if (HasDevInstance) return;

    const settings = new SettingsSection("Simple Beautiful Lyrics", "simple-beautiful-lyrics");

    const endpoint = settings.getFieldValue("api-endpoint") as string;
    if (/^(http|https):\/\/[^ "]+$/.test(endpoint)) {
        settings.setFieldValue("api-input-endpoint", endpoint);
        setAPIEndpoint(endpoint);
    } else {
        setAPIEndpoint(DEFAULT_API_ENDPOINT);
        settings.setFieldValue("api-endpoint", DEFAULT_API_ENDPOINT);
        settings.setFieldValue("api-input-endpoint", DEFAULT_API_ENDPOINT);
    }

    // Add settings
    settings.addToggle("override-fetch", "Override Spotify's 'fetch' function to enable searching for alternative lyric sources (app refresh recommended)", true, () => {
        const fetchOverrideToggle = Boolean(settings.getFieldValue("override-fetch"));
        toggleFetchOverride(fetchOverrideToggle);
    });
    settings.addInput("api-input-endpoint", `API Endpoint (default: ${DEFAULT_API_ENDPOINT})`, DEFAULT_API_ENDPOINT);
    settings.addButton("api-submit", "Save API Endpoint", "Save Setting", () => {
        let endpoint = settings.getFieldValue("api-input-endpoint") as string;
        const regex = /^(http|https):\/\/[^ "]+$/;

        if (!regex.test(endpoint)) {
            endpoint = DEFAULT_API_ENDPOINT;
            settings.setFieldValue("api-input-endpoint", endpoint);
            Spicetify.showNotification("Invalid API Endpoint. Default value restored.");
            return;
        }

        setAPIEndpoint(endpoint);
        settings.setFieldValue("api-endpoint", endpoint);
        Spicetify.showNotification("API Endpoint saved!");
    });
    settings.addToggle("enable-debug", "Enable debug logging", false, () => {
        setLogEnabled(Boolean(settings.getFieldValue("enable-debug")));
    });
    settings.addButton("clear-cache", "Clear Lyrics Cache", "Clear", () => {
        clearLyricsCache();
        Spicetify.showNotification("Lyrics cache cleared!");
    });
    settings.pushSettings();

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
            const mainLyricsContainer = Spotify.getComponent<HTMLDivElement>("MainLyricsContainerClass", document.body);
            CheckForLiveBackgrounds(mainLyricsContainer);
            CheckForLyricsContainers(mainLyricsContainer);
            // CheckForContributeContainer(mainLyricsContainer);
        })
    );

    observer.observe(document.body, { attributes: false, childList: true, subtree: true });

    // Fix the lyrics-cinema mode
    const lyricsCinema = document.querySelector<HTMLDivElement>("#lyrics-cinema");
    lyricsCinema?.style.setProperty("grid-area", "main-view / main-view / main-view / right-sidebar");
    lyricsCinema?.style.setProperty("overflow", "hidden");

    // Check for initial elements
    const mainLyricsContainer = Spotify.getComponent<HTMLDivElement>("MainLyricsContainerClass", document.body);
    CheckForLiveBackgrounds(mainLyricsContainer);
    // CheckForContributeContainer(mainLyricsContainer);
    // StartCheckContribute(mainLyricsContainer);
    StartCheckLyrics(mainLyricsContainer);
}

export default main;
