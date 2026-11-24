// Minimal typed event emitter.

export class Signal<Args extends unknown[] = []> {
    private listeners = new Set<(...args: Args) => void>();

    /** Subscribes a listener. Returns a function that unsubscribes it. */
    connect(listener: (...args: Args) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    fire(...args: Args): void {
        // Copy first so listeners may unsubscribe while being called
        for (const listener of [...this.listeners]) listener(...args);
    }
}
