// import { Start as StartCheckContribute, CheckForContributeContainer } from "./modules/LyricsContribute";
import { SettingsSection } from "../../../lib/settings-section/SettingsSection"; // Library for easier settings management
import { toggleFetchOverride, clearLyricsCache } from "./FetchOv";
import { setLogEnabled } from "./Logger";

const DEFAULT_API_ENDPOINT = "https://lyrics.kamiloo13.me/api";
const URL_REGEX = /^https?:\/\/([\w-]+(\.[\w-]+)+|localhost)(:[0-9]{1,5})?(\/[^\s\?]*)?$/;
const CacheVersion = "1";

async function main() {
    const settings = new SettingsSection("More Lyrics", "more-lyrics");

    const endpoint = settings.getFieldValue("api-endpoint") as string;
    if (URL_REGEX.test(endpoint)) {
        settings.setFieldValue("api-input-endpoint", endpoint);
    } else {
        settings.setFieldValue("api-endpoint", DEFAULT_API_ENDPOINT);
        settings.setFieldValue("api-input-endpoint", DEFAULT_API_ENDPOINT);
    }

    // Add settings
    settings.addToggle("app-enabled", "Enable More Lyrics (overrides Spotify's fetch function)", true, () => {
        const fetchOverrideToggle = Boolean(settings.getFieldValue("app-enabled"));
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
    toggleFetchOverride(Boolean(settings.getFieldValue("app-enabled")));
}

export default main;
