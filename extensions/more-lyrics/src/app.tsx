// import { Start as StartCheckContribute, CheckForContributeContainer } from "./modules/LyricsContribute";
import { SettingsSection } from "../../../lib/settings-section/SettingsSection"; // Library for easier settings management
import { toggleFetchOverride, clearLyricsCache } from "./FetchOv";
import { setLogEnabled } from "./Logger";

const DEFAULT_API_ENDPOINT = "https://lyrics.kamiloo13.me/api";
const URL_REGEX = /^https?:\/\/([\w-]+(\.[\w-]+)+|localhost)(:[0-9]{1,5})?(\/[^\s\?]*)?$/;
const CacheVersion = "2";

async function main() {
    const settings = new SettingsSection("More Lyrics", "more-lyrics");

    const endpoint = settings.getFieldValue<string>("api-endpoint");
    if (endpoint && endpoint.length > 4 && URL_REGEX.test(endpoint)) {
        settings.setFieldValue("api-input-endpoint", endpoint);
    } else {
        settings.setFieldValue("api-endpoint", DEFAULT_API_ENDPOINT);
        settings.setFieldValue("api-input-endpoint", DEFAULT_API_ENDPOINT);
    }

    const countryCode = settings.getFieldValue<string>("country-code");
    if (countryCode && (countryCode.length === 2 || countryCode.length === 0)) {
        settings.setFieldValue("country-code-input", countryCode);
    } else {
        settings.setFieldValue("country-code", "");
        settings.setFieldValue("country-code-input", "");
    }

    // Add settings
    settings.addToggle("app-enabled", "Enable More Lyrics (overrides Spotify's fetch function)", true, () => {
        const fetchOverrideToggle = Boolean(settings.getFieldValue<boolean>("app-enabled"));
        toggleFetchOverride(fetchOverrideToggle);
    });
    settings.addInput("api-input-endpoint", `API Endpoint (default: ${DEFAULT_API_ENDPOINT})`, DEFAULT_API_ENDPOINT, () => {}, "text", {
        onBlur: (e) => {
            const endpoint = e.target.value;

            if (endpoint.length > 4 && endpoint === settings.getFieldValue<string>("api-endpoint")) return;

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
            if (token === settings.getFieldValue<string>("api-token")) return;
            settings.setFieldValue("api-token", token);
            Spicetify.showNotification("API Token saved!");
        }
    });
    settings.addInput("country-code-input", "Country Code (optional, ISO 3166-1 alpha-2)", "", () => {}, "text", {
        onBlur: (e) => {
            const code = e.target.value.toUpperCase();
            if (code.length !== 2 && code.length !== 0) {
                e.target.value = settings.getFieldValue<string>("country-code") || "";
                Spicetify.showNotification("Invalid Country Code. It must be 2 characters long or empty.");
                return;
            }
            if (code === settings.getFieldValue<string>("country-code")) return;
            settings.setFieldValue("country-code", code);
            Spicetify.showNotification("Country Code saved!");
        }
    });
    settings.addToggle("enable-debug", "Enable debug logging", false, () => {
        setLogEnabled(Boolean(settings.getFieldValue<boolean>("enable-debug")));
    });
    settings.addButton("clear-cache", "Clear Lyrics Cache", "Clear", () => {
        clearLyricsCache();
        Spicetify.showNotification("Lyrics cache cleared!");
    });
    settings.pushSettings();

    // Check if cache version is up to date
    const cacheVersion = settings.getFieldValue<string>("cache-version");
    if (cacheVersion !== CacheVersion) {
        settings.setFieldValue("cache-version", CacheVersion);
        clearLyricsCache();
    }

    // Read settings
    setLogEnabled(Boolean(settings.getFieldValue<boolean>("enable-debug")));
    toggleFetchOverride(Boolean(settings.getFieldValue<boolean>("app-enabled")));
}

export default main;
