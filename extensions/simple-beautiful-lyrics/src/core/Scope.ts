// A Scope collects everything that has to be undone later (observers, listeners, injected elements, ...).
// Calling `clean()` runs all registered tasks in reverse order. Scopes can be nested with `child()`.

import { Log } from "./Log";

type Task = () => void;

export class Scope {
    private tasks: Task[] = [];
    private children = new Map<string, Scope>();

    /** Registers a cleanup task. */
    add(task: Task): void {
        this.tasks.push(task);
    }

    /** Disconnects the observer when the scope is cleaned. */
    observer<T extends { disconnect(): void }>(observer: T): T {
        this.add(() => observer.disconnect());
        return observer;
    }

    /** Removes the element from the DOM when the scope is cleaned. */
    element<T extends Element>(element: T): T {
        this.add(() => element.remove());
        return element;
    }

    /** Adds an event listener and removes it when the scope is cleaned. */
    listen<K extends keyof WindowEventMap>(
        target: Window,
        type: K,
        listener: (event: WindowEventMap[K]) => void,
        options?: boolean | AddEventListenerOptions
    ): void {
        target.addEventListener(type, listener, options);
        this.add(() => target.removeEventListener(type, listener, options));
    }

    /**
     * Returns a fresh child scope registered under `name`.
     * A previous child with the same name is cleaned first.
     */
    child(name: string): Scope {
        this.children.get(name)?.clean();
        const child = new Scope();
        this.children.set(name, child);
        return child;
    }

    /** Cleans the child scope registered under `name` (if any). */
    cleanChild(name: string): void {
        this.children.get(name)?.clean();
        this.children.delete(name);
    }

    /** Runs every task (newest first) and cleans all child scopes. Errors are logged, not thrown. */
    clean(): void {
        for (const child of this.children.values()) child.clean();
        this.children.clear();

        const tasks = this.tasks.reverse();
        this.tasks = [];
        for (const task of tasks) {
            try {
                task();
            } catch (error) {
                Log.error("Cleanup task failed:", error);
            }
        }
    }
}
