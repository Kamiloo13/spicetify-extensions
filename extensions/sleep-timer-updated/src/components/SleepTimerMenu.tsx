import React, { useEffect, useState, useRef } from "react";
import InputNumeric from "./InputNumeric";

interface SleepTimerMenuProps {
    isVisible: boolean;
    setIsMenuActive: (value: boolean) => void;
    updateDom: () => void;
    sleepTimerButton: Spicetify.Playbar.Button;
}

interface SleepTimer {
    type: RadioValue;
    count: number;
    timer?: NodeJS.Timeout;
}

export type RadioValue = "disabled" | "song" | "minute";

const SleepTimerMenu: React.FC<SleepTimerMenuProps> = ({ isVisible, updateDom, setIsMenuActive, sleepTimerButton }) => {
    const [songCount, setSongCount] = useState(1);
    const [minuteCount, setMinuteCount] = useState(30);
    const [radioValue, setRadioValue] = useState<RadioValue>("disabled");
    const [remainingString, setRemainingString] = useState<string>("");
    const sleepTimerRef = useRef<SleepTimer>({ type: "disabled", count: 0 });

    useEffect(() => {
        const onSongChange = () => {
            const { current: sleepTimer } = sleepTimerRef;
            if (sleepTimer.type === "song") {
                if (sleepTimer.count > 1) {
                    UpdateSleepTimerRef({ type: "song", count: sleepTimer.count - 1 });
                    sleepTimerButton.label = `${sleepTimer.count - 1} song${sleepTimer.count - 1 == 1 ? "" : "s"} remaining`;
                } else {
                    disableSleepTimer();
                    if (Spicetify.Player.isPlaying()) Spicetify.Player.pause();
                }
            }
        };

        Spicetify.Player.addEventListener("songchange", onSongChange);

        return () => {
            Spicetify.Player.removeEventListener("songchange", onSongChange);
        };
    }, []);

    const UpdateSleepTimerRef = (newVal: SleepTimer) => {
        sleepTimerRef.current = { ...sleepTimerRef.current, ...newVal };
        updateDom();
    };

    function toggleSleepTimer() {
        if (sleepTimerRef.current.type != "disabled") {
            disableSleepTimer();
        } else {
            enableSleepTimer();
        }
    }

    function enableSleepTimer() {
        setIsMenuActive(false);
        sleepTimerButton.label = `${radioValue == "song" ? `${songCount} song${songCount == 1 ? "" : "s"} remaining` : "Sleep Timer"}`;

        if (radioValue == "minute") {
            const start = Date.now();

            const timer = setInterval(updateTimeRemaining, 1000, start, minuteCount);
            updateTimeRemaining(start - 200, minuteCount);

            UpdateSleepTimerRef({ type: radioValue, count: minuteCount, timer: timer });
        } else if (radioValue == "song") {
            UpdateSleepTimerRef({ type: radioValue, count: songCount });
        }
    }

    function updateTimeRemaining(start: number, minuteCount: number) {
        const delta = Date.now() - start;
        const secondsRemaining = (minuteCount * 60 * 1000 - delta) / 1000;

        const hours = Math.floor(secondsRemaining / 3600);
        const minutes = Math.floor((secondsRemaining % 3600) / 60);
        const seconds = Math.floor(secondsRemaining % 60);

        const timeRemaining =
            hours > 0
                ? `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
                : `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

        setRemainingString(timeRemaining);
        sleepTimerButton.label = `${timeRemaining} remaining`;

        if (secondsRemaining <= 0) {
            disableSleepTimer();
            if (Spicetify.Player.isPlaying()) startPauseProcess();
        }
    }

    function disableSleepTimer() {
        clearInterval(sleepTimerRef.current.timer);
        UpdateSleepTimerRef({ type: "disabled", count: 0 });
        sleepTimerButton.label = "Sleep Timer";
    }

    function startPauseProcess() {
        const currentVolume = Spicetify.Player.getVolume();
        const fadeOutTime = 15000;
        const fadeOutInterval = 100;
        const fadeOutSteps = fadeOutTime / fadeOutInterval;
        const fadeOutVolumeStep = currentVolume / fadeOutSteps;

        let volume = currentVolume;
        const fadeOutTimer = setInterval(() => {
            volume -= fadeOutVolumeStep;
            Spicetify.Player.setVolume(volume);
            if (volume <= 0) {
                clearInterval(fadeOutTimer);
                Spicetify.Player.pause();
                setTimeout(() => {
                    Spicetify.Player.setVolume(currentVolume);
                }, 500);
            }
        }, fadeOutInterval);
    }

    if (!isVisible) {
        return null;
    }

    return (
        <div id="sleep-timer-menu">
            <div style={{ maxHeight: "calc(100vh - 90px)", padding: "5px" }}>
                <div className="header">
                    <h3>Sleep Timer</h3>
                </div>
                <div className="inputs-wrapper">
                    <InputNumeric idTextValue="song" setNumericValue={setSongCount} setRadioValue={setRadioValue} numericValue={songCount} radioValue={radioValue} />
                    <InputNumeric idTextValue="minute" setNumericValue={setMinuteCount} setRadioValue={setRadioValue} numericValue={minuteCount} radioValue={radioValue} />
                </div>
                <button
                    type="button"
                    className={sleepTimerRef.current.type === "disabled" ? "btn btn-success" : "btn btn-primary"}
                    id="sleep-timer-start"
                    disabled={radioValue === "disabled"}
                    onClick={toggleSleepTimer}
                >
                    {sleepTimerRef.current.type === "disabled"
                        ? "Start Timer"
                        : `Stop Timer ${
                              sleepTimerRef.current.type === "song"
                                  ? `(${sleepTimerRef.current.count} song${sleepTimerRef.current.count == 1 ? "" : "s"} remaining)`
                                  : `(${remainingString} remaining)`
                          }`}
                </button>
            </div>
        </div>
    );
};

export default SleepTimerMenu;
