import React, { useState } from "react";

import "../styles/main.scss";
import SleepTimerMenu from "./components/SleepTimerMenu";

interface MainProps {
    sleepButton: Spicetify.Playbar.Button;
}

const sleepTimerButton = new Spicetify.Playbar.Button(
    "Sleep Timer",
    '<svg class="Svg-sc-ytk21e-0 Svg-img-icon-small" xml:space="preserve" viewBox="0 0 1000 1000" y="0px" x="0px" height="16px" width="16px" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" version="1.1"><path d="M525.3,989.5C241.2,989.5,10,758.3,10,474.1c0-196.8,109.6-373.6,285.9-461.4c7.9-3.9,17.5-2.4,23.7,3.8c6.2,6.2,7.9,15.8,4,23.7c-32.2,65.4-48.5,135.7-48.5,208.9c0,261.4,212.7,474.1,474.1,474.1c74,0,145-16.7,211-49.5c7.9-3.9,17.5-2.4,23.7,3.8c6.3,6.3,7.9,15.8,3.9,23.7C900.5,879,723.3,989.5,525.3,989.5z"></path></svg>',
    () => {
        setMenuActive(!isMenuActive);

        
    }
);

const Main: React.FC<MainProps> = ({ sleepButton }) => {
    const [isMenuActive, setMenuActive] = useState(false);

    

    return <SleepTimerMenu isVisible={isMenuActive} sleepTimerButton={sleepButton} />;
};

export default Main;
