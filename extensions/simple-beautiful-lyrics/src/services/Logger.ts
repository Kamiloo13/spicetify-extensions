let isEnabled = false;
const setLogEnabled = (state: boolean) => {
    isEnabled = state;
};
const log = (...args: any[]) => (isEnabled && console.log("[SBL]:", ...args)) as void;

export { log, setLogEnabled };
