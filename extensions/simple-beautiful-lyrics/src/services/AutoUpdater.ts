// Packages
import Timeout from "./Timeout";

// Project Details
import { version as PackageVersion } from "../../package.json";

// Services
import { GlobalCleanup, HasDevInstance, Script, ShowNotification } from "./Session";

// Behavior Constants
const JustUpdatedNotificationLifetime = 7.5; // Measured in Seconds

const NextFailedUpdateCheck = 60; // Measured in Seconds
const NextSuccessfulUpdateCheck = 300; // Measured in Seconds

type Version = {
    Text: string;

    Major: number;
    Minor: number;
    Patch: number;
    Control?: number;
};

const GetVersionInformation = (text: string): Version | undefined => {
    const versionMatches = text.match(/(\d+)\.(\d+)\.(\d+)(?:\.(\d+))?/);

    if (versionMatches === null) {
        return undefined;
    }

    return {
        Text: versionMatches[0],

        Major: parseInt(versionMatches[1]),
        Minor: parseInt(versionMatches[2]),
        Patch: parseInt(versionMatches[3]),
        Control: versionMatches[4] ? parseInt(versionMatches[4]) : undefined
    };
};

const GetVersionDistance = (fromVersion: Version, toVersion: Version): [Version, boolean] => {
    const versionDistance = {
        Text: "",

        Major: toVersion.Major - fromVersion.Major,
        Minor: toVersion.Minor - fromVersion.Minor,
        Patch: toVersion.Patch - fromVersion.Patch,
        Control:
            toVersion.Control === undefined && fromVersion.Control === undefined
                ? 0
                : toVersion.Control === undefined
                ? fromVersion.Control
                : fromVersion.Control === undefined
                ? fromVersion.Control
                : toVersion.Control - fromVersion.Control
    };

    return [versionDistance, versionDistance.Major !== 0 || versionDistance.Minor !== 0 || versionDistance.Patch !== 0 || versionDistance.Control! !== 0];
};

const ExtensionVersion = GetVersionInformation(PackageVersion)!;

// Handle applying our update
const ApplyUpdate = (source: string) => {
    // First destroy our GlobalMaid
    GlobalCleanup.Clean();

    // Find our existing-style and remove it
    document.querySelector("#simpleDbeautifulDlyrics")?.remove();

    // Now create our new script
    const newScript = document.createElement("script");
    newScript.setAttribute("type", "text/javascript");
    newScript.innerHTML = source;
    document.body.appendChild(newScript);

    // Now remove our old script
    Script.remove();
};

// Handle update-checking
const CheckForUpdate = async () => {
    // Store our next timeout duration
    let nextTimeoutDuration = NextFailedUpdateCheck;

    // Grab our version
    fetch("https://api.github.com/repos/kamiloo13/spicetify-extensions/contents/extensions/simple-beautiful-lyrics/dist/simple-beautiful-lyrics.js")
        .then((data) => data.json())
        .then((data) => fetch(`https://api.github.com/repos/kamiloo13/spicetify-extensions/git/blobs/${data.sha}`))
        .then((data) => data.json())
        .then((data) => atob(data.content))
        .then((text) => {
            // Grab our cached version
            const cachedVersion = GetVersionInformation(text);
            if (cachedVersion === undefined) {
                return;
            }

            const [versionDistance, isDifferent] = GetVersionDistance(ExtensionVersion, cachedVersion);

            if (isDifferent && (cachedVersion.Major > 2 || (cachedVersion.Major == 2 && cachedVersion.Minor >= 4))) {
                // Now send out the notifcation
                ShowNotification(
                    "<h3>Simple Beautiful Lyrics Updated!</h3>" +
                        "<h4 style = 'margin-top: 4px; margin-bottom: 4px; font-weight: normal;'>No need to re-install - it's already running!</h4>" +
                        `<span style = 'opacity: 0.75;'>Version ${ExtensionVersion.Text} -> ${cachedVersion.Text}</span>`,
                    versionDistance.Major > 0 ? "success" : versionDistance.Major < 0 || versionDistance.Minor < 0 || versionDistance.Patch < 0 ? "warning" : "info",
                    JustUpdatedNotificationLifetime
                );

                // Obviously we should return here
                return ApplyUpdate(text);
            }

            // Check for an update again in a little bit
            nextTimeoutDuration = NextSuccessfulUpdateCheck;
        })
        .catch((e) => console.warn(`Error: ${e}`))
        .finally(() => GlobalCleanup.AddTask(Timeout(nextTimeoutDuration, CheckForUpdate), "CheckForUpdate"));
};

export const Start = () => {
    if (!HasDevInstance) {
        console.log("[simple-beautiful-lyrics] AutoUpdater: Checking for Updates");
        CheckForUpdate();
    } else {
        console.log("[simple-beautiful-lyrics] AutoUpdater: Development Mode - Skipping Update Check");
    }
};
