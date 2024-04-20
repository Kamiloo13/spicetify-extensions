// Initial Services
import { GlobalCleanup, IsSpicetifyLoaded } from "./services/Session";
import { Start as StartAutoUpdater } from "./services/AutoUpdater";
import { Start as StartCoverArt } from "./services/CoverArt";
import { CheckForLiveBackgrounds } from "./modules/LyricsBackground";
import { CheckForLyricsContainers } from "./modules/LyricsContainer";
import Player from "./services/Player";

async function main() {
    while (!IsSpicetifyLoaded()) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

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
    CheckForLyricsContainers();
}

export default main;
