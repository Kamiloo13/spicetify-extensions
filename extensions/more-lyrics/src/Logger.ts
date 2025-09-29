let isEnabled = false;
const setLogEnabled = (state: boolean) => {
    isEnabled = state;
};
const log = (...args: any[]) => (isEnabled && console.log("[More Lyrics]:", ...args)) as void;
const error = (...args: any[]) => console.error("[More Lyrics]:", ...args) as void;

export { log, error, setLogEnabled };
