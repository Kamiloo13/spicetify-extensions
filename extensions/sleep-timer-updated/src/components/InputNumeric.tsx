import React, { useState } from "react";
import { RadioValue } from "./SleepTimerMenu";

interface InputNumericProps {
    numericValue: number;
    setNumericValue: (value: number) => void;
    radioValue: RadioValue;
    setRadioValue: (value: RadioValue) => void;
    idTextValue: "song" | "minute";
}

const InputNumeric: React.FC<InputNumericProps> = ({ numericValue, setNumericValue, radioValue, setRadioValue, idTextValue }) => {
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

    const toogleRadioValue = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRadioValue(event.target.value as RadioValue);
    };

    const onChangeHandler = (value: number) => {
        setNumericValue(Math.max(Math.min(value, 999), 1));
    };

    const startInterval = (method: () => void) => {
        function loop() {
            method();
            const id = setTimeout(loop, 35);
            setIntervalId(id);
        }

        method();

        const id = setTimeout(loop, 500);
        setIntervalId(id);
    };

    const handleMouseUp = () => {
        if (intervalId) {
            clearInterval(intervalId);
            clearTimeout(intervalId);
            setIntervalId(null);
        }
    };

    return (
        <div className="input-wrapper-flex">
            <input
                className="check-input"
                type="radio"
                id={`sleep-after-${idTextValue}`}
                name="sleep-after"
                value={idTextValue}
                checked={radioValue === idTextValue}
                onChange={toogleRadioValue}
            />
            <label htmlFor={`sleep-after-${idTextValue}`}>
                <p>Sleep after</p>
                <div className="input-group">
                    <button
                        style={{ minWidth: "2.5rem" }}
                        className="btn btn-field-change"
                        onMouseDown={() => startInterval(() => (onChangeHandler(--numericValue), setRadioValue(idTextValue)))}
                        onMouseUp={handleMouseUp}
                    >
                        <strong>−</strong>
                    </button>
                    <input
                        type="text"
                        value={numericValue}
                        onChange={(e) => onChangeHandler(parseInt(e.target.value) || 0)}
                        onKeyDown={isNumber}
                        onPaste={(e) => e.preventDefault()}
                        autoComplete="off"
                    />
                    <button
                        style={{ minWidth: "2.5rem" }}
                        className="btn btn-field-change"
                        onMouseDown={() => startInterval(() => (onChangeHandler(++numericValue), setRadioValue(idTextValue)))}
                        onMouseUp={handleMouseUp}
                    >
                        <strong>+</strong>
                    </button>
                </div>
                <p>{idTextValue}(s)</p>
            </label>
        </div>
    );
};

function isNumber(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!((event.key >= "0" && event.key <= "9") || event.key === "Backspace" || event.key === "Delete" || event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault();
    }
}

export default InputNumeric;
