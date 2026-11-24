// Small prefixed logger.
// Every message is also kept in a short in-memory history so it can be included in the diagnostics report.
// Debug messages are printed only when `localStorage["sbl:debug"] === "1"`.

const Prefix = "[SBL]";
const DebugStorageKey = "sbl:debug";
const HistoryLimit = 50;

type Level = "debug" | "info" | "warn" | "error";

interface Entry {
    time: string;
    level: Level;
    message: string;
}

const history: Entry[] = [];

const readDebugFlag = (): boolean => {
    try {
        return localStorage.getItem(DebugStorageKey) === "1";
    } catch {
        return false;
    }
};

let debugEnabled = readDebugFlag();

const stringify = (value: unknown): string => {
    if (value instanceof Error) return `${value.name}: ${value.message}`;
    if (typeof value === "string") return value;
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
};

const write = (level: Level, args: unknown[]) => {
    history.push({ time: new Date().toISOString(), level, message: args.map(stringify).join(" ") });
    if (history.length > HistoryLimit) history.shift();

    if (level === "debug" && !debugEnabled) return;
    const method = level === "debug" ? console.debug : level === "info" ? console.info : level === "warn" ? console.warn : console.error;
    method(Prefix, ...args);
};

export const Log = {
    debug: (...args: unknown[]) => write("debug", args),
    info: (...args: unknown[]) => write("info", args),
    warn: (...args: unknown[]) => write("warn", args),
    error: (...args: unknown[]) => write("error", args),

    /** Enables or disables debug output (persisted in localStorage). */
    setDebug(enabled: boolean) {
        debugEnabled = enabled;
        try {
            if (enabled) localStorage.setItem(DebugStorageKey, "1");
            else localStorage.removeItem(DebugStorageKey);
        } catch {
            // Storage may be unavailable - the flag then only lives for this session
        }
    },

    /** Copy of the recent messages (newest last). */
    history: (): Entry[] => history.slice()
};
