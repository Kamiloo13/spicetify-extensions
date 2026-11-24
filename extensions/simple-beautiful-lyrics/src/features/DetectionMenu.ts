// "Simple Beautiful Lyrics" submenu in the Spicetify profile menu:
//   - Fix lyrics detection: the user clicks a lyric line and we learn its class (fallback for the automatic detection)
//   - Reset learned line classes
//   - Copy diagnostics: copies the diagnostics report to the clipboard

import { Log } from "../core/Log";
import { Scope } from "../core/Scope";
import { notify } from "../core/Spicetify";
import { LineClasses } from "../dom/LineClasses";

const HighlightOutline = "2px dashed #1ed760";

/**
 * Walks up from the clicked element to the first element that shares a class with at least two of its siblings -
 * that is a lyric line, and the shared class is the line class.
 */
const findLineClass = (element: HTMLElement): string | undefined => {
    for (let node: HTMLElement | null = element; node && node !== document.body; node = node.parentElement) {
        const parent = node.parentElement;
        if (!parent) break;

        const siblings = Array.from(parent.children).filter((sibling) => sibling !== node);
        const shared = Array.from(node.classList).find((className) => siblings.filter((s) => s.classList.contains(className)).length >= 2);
        if (shared) return shared;
    }
    return undefined;
};

export class DetectionMenu {
    private readonly scope: Scope;

    constructor(
        parent: Scope,
        private readonly onClassesChanged: () => void,
        private readonly diagnose: () => unknown
    ) {
        this.scope = parent.child("menu");

        const Menu = Spicetify.Menu;
        if (Menu?.SubMenu === undefined || Menu?.Item === undefined) {
            Log.warn("Spicetify.Menu is not available - the detection menu is disabled.");
            return;
        }

        const subMenu = new Menu.SubMenu("Simple Beautiful Lyrics", [
            new Menu.Item("Fix lyrics detection (pick a line)", false, () => this.startPicker()),
            new Menu.Item("Reset learned line classes", false, () => this.resetClasses()),
            new Menu.Item("Copy diagnostics", false, () => void this.copyDiagnostics())
        ]);
        subMenu.register();
        this.scope.add(() => subMenu.deregister());
    }

    private startPicker(): void {
        const scope = this.scope.child("picker");
        const stop = () => this.scope.cleanChild("picker");

        let hovered: HTMLElement | null = null;
        const highlight = (element: HTMLElement | null) => {
            if (hovered) hovered.style.outline = "";
            hovered = element;
            if (hovered) hovered.style.outline = HighlightOutline;
        };
        scope.add(() => highlight(null));

        document.documentElement.style.cursor = "crosshair";
        scope.add(() => (document.documentElement.style.cursor = ""));

        scope.listen(window, "mouseover", (event) => highlight(event.target instanceof HTMLElement ? event.target : null), true);
        scope.listen(
            window,
            "keydown",
            (event) => {
                if (event.key !== "Escape") return;
                stop();
                notify("Lyrics picker cancelled.");
            },
            true
        );
        scope.listen(
            window,
            "click",
            (event) => {
                // Swallow the click so Spotify does not seek to the clicked line
                event.preventDefault();
                event.stopImmediatePropagation();
                const target = event.target instanceof HTMLElement ? event.target : null;
                stop();

                const lineClass = target ? findLineClass(target) : undefined;
                if (!lineClass) {
                    notify("That doesn't look like a lyrics line. Open the lyrics and click one of the lines.", true, 6000);
                    return;
                }

                LineClasses.learn("Line", lineClass);
                notify("Lyrics line learned.");
                this.onClassesChanged();
            },
            true
        );

        notify("Click any lyrics line (Esc to cancel).", false, 6000);
    }

    private resetClasses(): void {
        LineClasses.reset();
        notify("Learned line classes were reset.");
        this.onClassesChanged();
    }

    private async copyDiagnostics(): Promise<void> {
        const report = JSON.stringify(this.diagnose());
        try {
            await navigator.clipboard.writeText(report);
            notify("Diagnostics copied to the clipboard.");
        } catch {
            console.log(report);
            notify("Could not access the clipboard - diagnostics were printed to the DevTools console.", true, 6000);
        }
    }
}
