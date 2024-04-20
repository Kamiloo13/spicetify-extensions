interface Task {
    id?: string;
    task: () => void;
}

interface SubCleanup {
    instance: Cleanup;
    id?: string;
}

class Cleanup {
    private tasks: Task[] = [];
    private subCleanups: SubCleanup[] = [];

    // Add tasks to the list
    AddTask(task: () => void, id?: string) {
        if (id) this.Clean(id);
        this.tasks.push({ id: id, task });
    }

    AddSubCleanup(instance: Cleanup, id?: string) {
        this.subCleanups.push({ instance: instance, id });
        return instance;
    }

    AddObserver(observer: MutationObserver | ResizeObserver, id?: string) {
        this.AddTask(observer.disconnect.bind(observer), id);
        return observer;
    }

    AddHtml(element: HTMLElement, id?: string) {
        this.AddTask(() => {
            element.remove();
        }, id);
        return element;
    }

    // Run tasks and removes them from list
    Clean(id?: string) {
        if (id) {
            this.tasks = this.tasks.filter((task) => {
                if (task.id === id) {
                    task.task();
                    return false;
                }
                return true;
            });
            this.subCleanups = this.subCleanups.filter((subCleanup) => {
                if (subCleanup.id === id) {
                    subCleanup.instance.Clean();
                    return false;
                }
                return true;
            });
        } else {
            this.tasks.forEach((task) => {
                task.task();
            });
            this.subCleanups.forEach((subCleanup) => {
                subCleanup.instance.Clean();
            });
            this.tasks = [];
        }
    }
}

export default Cleanup;
