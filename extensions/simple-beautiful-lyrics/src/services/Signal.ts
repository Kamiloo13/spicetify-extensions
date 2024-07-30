class Signal {
    private listeners: (() => void)[] = [];

    public Connect(listener: () => void): () => void {
        this.listeners.push(listener);
        return () => this.Disconnect(listener);
    }

    public Disconnect(listener: () => void): void {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    public Fire(): void {
        this.listeners.forEach((listener) => listener());
    }
}

export default Signal;
