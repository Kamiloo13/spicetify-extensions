import { SpotifyPlayer, GlobalCleanup } from "./Session";
import Signal from "./Signal";

class Player {
    public SongChanged = new Signal();

    private Started = false;

    public Start() {
        if (this.Started !== true) {
            this.Started = true;

            const callback = () => {
                this.SongChanged.Fire();
            };

            SpotifyPlayer.addEventListener("songchange", callback);
            GlobalCleanup.AddTask(() => SpotifyPlayer.removeEventListener("songchange", callback));

            if (SpotifyPlayer.data !== undefined) {
                callback();
            }
        }
    }
}

export default new Player();
