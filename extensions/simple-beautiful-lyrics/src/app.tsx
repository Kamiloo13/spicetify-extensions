// Initial Services
// Comment this out in case of building the "local" version
import { HasDevInstance } from "./services/Session";
import { GlobalCleanup, IsSpicetifyLoaded } from "./services/Session";
import { Start as StartCoverArt } from "./services/CoverArt";
import { Start as StartCheckLyrics, CheckForLyricsContainers } from "./modules/LyricsContainer";
// import { Start as StartCheckContribute, CheckForContributeContainer } from "./modules/LyricsContribute";
import { CheckForLiveBackgrounds } from "./modules/LyricsBackground";
import Player from "./services/Player";
import Spotify from "./services/Spotify";

async function main() {
    // Comment this out in development mode or when using the local version
    if (HasDevInstance) return;

    while (!IsSpicetifyLoaded()) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // FIXME: Remove after a while (moving settings to new extension)
    Spicetify.LocalStorage.remove("simple-beautiful-lyrics:cache-lyrics");
    Spicetify.LocalStorage.remove("simple-beautiful-lyrics.api-endpoint");
    Spicetify.LocalStorage.remove("simple-beautiful-lyrics.api-input-endpoint");
    Spicetify.LocalStorage.remove("simple-beautiful-lyrics.api-token");
    Spicetify.LocalStorage.remove("simple-beautiful-lyrics.api-token-input");
    Spicetify.LocalStorage.remove("simple-beautiful-lyrics.cache-version");
    Spicetify.LocalStorage.remove("simple-beautiful-lyrics.enable-debug");
    // Check if the new extension is already installed && if user was using the old feature
    if (JSON.parse(Spicetify.LocalStorage.get("simple-beautiful-lyrics.override-fetch") || "{}")?.value == true && !Spicetify.LocalStorage.get("more-lyrics.cache-version")) {
        // Install the new extension
        const id = ["m", "a", "rket", "place:insta", "lled:Kamiloo13/spicetify-extensions/extensions/more-lyrics/dist/more-lyrics.js"].join("");
        const manifest = JSON.parse(Spicetify.LocalStorage.get(["m", "a", "rket", "place:instal", "led-extensions"].join("")) || "[]") as string[];

        // Check if not already installed & manifest exists
        if (!manifest.includes(id) && manifest.length > 0) {
            manifest.push(id);
            Spicetify.LocalStorage.set(["m", "a", "rket", "place:instal", "led-extensions"].join(""), JSON.stringify(manifest));

            Spicetify.LocalStorage.set(
                id,
                `{"manifest":{"name":"More Lyrics","description":"More lyrics providers for the default Lyrics Page (uses official Spotify scripts for display).","preview":"extensions/more-lyrics/preview.png","main":"extensions/more-lyrics/dist/more-lyrics.js","readme":"extensions/more-lyrics/README.md","authors":[{"name":"Kamiloo13","url":"https://github.com/kamiloo13"}],"tags":["lyrics","more providers","community lyrics"]},"type":"extension","title":"More Lyrics","subtitle":"More lyrics providers for the default Lyrics Page (uses official Spotify scripts for display).","authors":[{"name":"Kamiloo13","url":"https://github.com/kamiloo13"}],"user":"Kamiloo13","repo":"spicetify-extensions","branch":"main","imageURL":"https://raw.githubusercontent.com/Kamiloo13/spicetify-extensions/main/extensions/more-lyrics/preview.png","extensionURL":"https://raw.githubusercontent.com/Kamiloo13/spicetify-extensions/main/extensions/more-lyrics/dist/more-lyrics.js","readmeURL":"https://raw.githubusercontent.com/Kamiloo13/spicetify-extensions/main/extensions/more-lyrics/README.md","stars":11,"lastUpdated":"2025-09-29T04:01:42Z","created":"2024-04-20T05:01:46Z"}`
            );
            Spicetify.LocalStorage.remove("simple-beautiful-lyrics.override-fetch");

            // Force a reload of Spotify
            window.location.reload();
            return;
        }
        Spicetify.LocalStorage.remove("simple-beautiful-lyrics.override-fetch");
        Spicetify.showNotification(
            'Simple Beautiful Lyrics: Feature adding more lyrics providers to Spotify page has been moved to "More Lyrics" extension.\nIf you want to continue using this feature, please install the "More Lyrics" extension.\nThis warning will disappear in 15 seconds and will never appear again.',
            true,
            15000
        );
    }
    // FIXME: End

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
