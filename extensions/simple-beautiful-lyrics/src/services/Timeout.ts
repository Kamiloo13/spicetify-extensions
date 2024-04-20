const activeTimeouts: NodeJS.Timeout[] = [];

function Timeout(timeInSeconds: number, task: () => void): () => void {
    const timeout = setTimeout(() => {
        task();
    }, timeInSeconds * 1000);

    activeTimeouts.push(timeout);
    return StopTimeout.bind(null, timeout);
}

function StopTimeout(id: NodeJS.Timeout) {
    clearTimeout(id);
    const index = activeTimeouts.indexOf(id);
    if (index > -1) {
        activeTimeouts.splice(index, 1);
    }
}

export default Timeout;
