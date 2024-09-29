// Initial Services
import { GlobalCleanup, HasDevInstance, IsSpicetifyLoaded } from "./services/Session";
import { Start as StartCoverArt } from "./services/CoverArt";
import { CheckForLiveBackgrounds } from "./modules/LyricsBackground";
import { Start as StartCheckLyrics, CheckForLyricsContainers } from "./modules/LyricsContainer";
import Player from "./services/Player";

async function main() {
    while (!IsSpicetifyLoaded()) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Comment this out in development mode
    if (HasDevInstance) return;

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
