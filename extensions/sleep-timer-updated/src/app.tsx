import React from "react";
import ReactDOM from "react-dom";
import SleepTimerMenu from "./components/SleepTimerMenu";

import "./styles/main.scss";

// Initialize the container for the sleep timer menu
const SleepMenuContainer = document.createElement("div");
SleepMenuContainer.id = "sleep-timer-container";
SleepMenuContainer.style.position = "relative";

// Create the sleep timer button
const sleepTimerButton = new Spicetify.Playbar.Button(
    "Sleep Timer",
    '<svg class="sleep-timer-icon" xml:space="preserve" viewBox="0 0 1000 1000" y="0px" x="0px" height="16px" width="16px" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" version="1.1"><path d="M525.3,989.5C241.2,989.5,10,758.3,10,474.1c0-196.8,109.6-373.6,285.9-461.4c7.9-3.9,17.5-2.4,23.7,3.8c6.2,6.2,7.9,15.8,4,23.7c-32.2,65.4-48.5,135.7-48.5,208.9c0,261.4,212.7,474.1,474.1,474.1c74,0,145-16.7,211-49.5c7.9-3.9,17.5-2.4,23.7,3.8c6.3,6.3,7.9,15.8,3.9,23.7C900.5,879,723.3,989.5,525.3,989.5z"></path></svg>',
    () => setIsMenuActive(!isMenuActive)
);

// Fake State
let isMenuActive = false;
const setIsMenuActive = (value: boolean) => {
    isMenuActive = value;
    sleepTimerButton.active = value;
    updateDOM();
};

const updateDOM = () => {
    ReactDOM.render(<SleepTimerMenu isVisible={isMenuActive} setIsMenuActive={setIsMenuActive} updateDom={updateDOM} sleepTimerButton={sleepTimerButton} />, SleepMenuContainer);
};

// Main function
async function main() {
    // Wait until loaded
    while (!sleepTimerButton?.element?.parentElement) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Check if the parent element is available
    const parent = sleepTimerButton.element.parentElement;
    if (!parent) {
        console.error("[sleep-timer-updated] Failed to find parent element for sleep timer button");
        sleepTimerButton.deregister();
        return;
    }

    // Add event listener to close the menu when clicking outside of it
    document.addEventListener("mouseup", (event) => {
        if (event.button != 0) return false;

        const menu = document.querySelector("div#sleep-timer-container");
        if (!menu || !event.target) return;
        if (!menu.contains(event.target as Node) && !sleepTimerButton.element.contains(event.target as Node)) {
            setIsMenuActive(false);
        }
    });

    parent.insertBefore(SleepMenuContainer, sleepTimerButton.element);
    updateDOM();
}

export default main;
