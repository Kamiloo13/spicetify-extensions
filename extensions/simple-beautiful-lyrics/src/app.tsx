// Initial Services
import { GlobalCleanup, HasDevInstance, IsSpicetifyLoaded } from "./services/Session";
import { Start as StartAutoUpdater } from "./services/AutoUpdater";
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

    StartAutoUpdater();
    StartCoverArt();
    Player.Start();

    const observer = GlobalCleanup.AddObserver(
        new MutationObserver(() => {
            CheckForLiveBackgrounds();
            CheckForLyricsContainers();
        })
    );

    observer.observe(document.body, { attributes: false, childList: true, subtree: true });

    // Check for initial elements
    CheckForLiveBackgrounds();
    StartCheckLyrics();
}

export default main;
