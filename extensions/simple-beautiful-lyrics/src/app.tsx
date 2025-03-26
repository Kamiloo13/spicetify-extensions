// Initial Services
import { GlobalCleanup, HasDevInstance, IsSpicetifyLoaded } from "./services/Session";
import { Start as StartCoverArt } from "./services/CoverArt";
import { CheckForLiveBackgrounds } from "./modules/LyricsBackground";
import { Start as StartCheckLyrics, CheckForLyricsContainers } from "./modules/LyricsContainer";
import { SettingsSection } from "./modules/SettingsSection";
import Player from "./services/Player";
import { toggleFetchOverride, clearLyricsCache } from "./services/FetchOv";
import { setLogEnabled } from "./services/Logger";

async function main() {
    // Comment this out in development mode
    if (HasDevInstance) return;

    const settings = new SettingsSection("Simple Beautiful Lyrics", "simple-beautiful-lyrics");

    // Add settings
    settings.addToggle("override-fetch", "Override Spotify's 'fetch' function to enable searching for alternative lyric sources (app refresh recommended)", true, () => {
        const fetchOverrideToggle = Boolean(settings.getFieldValue("override-fetch"));
        toggleFetchOverride(fetchOverrideToggle);
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
            CheckForLiveBackgrounds();
            CheckForLyricsContainers();
        })
    );

    observer.observe(document.body, { attributes: false, childList: true, subtree: true });

    // Fix the lyrics-cinema mode
    const lyricsCinema = document.querySelector<HTMLDivElement>("#lyrics-cinema");
    lyricsCinema?.style.setProperty("grid-area", "main-view / main-view / main-view / right-sidebar");
    lyricsCinema?.style.setProperty("overflow", "hidden");

    // Check for initial elements
    CheckForLiveBackgrounds();
    StartCheckLyrics();
}

export default main;
