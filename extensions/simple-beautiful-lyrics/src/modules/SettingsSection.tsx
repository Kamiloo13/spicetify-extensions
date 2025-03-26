/**
 * @file SettingsSection.tsx
 * @description This code has been copied from (spcr-settings) and it has been modified to suit the needs of Simple Beautiful Lyrics.
 */

import React, { useState } from "react";
import ReactDOM from "react-dom";
import { ISettingsField, ISettingsFieldButton, ISettingsFieldToggle } from "../types/settings-field";

class SettingsSection {
    private settingsFields: { [nameId: string]: ISettingsField } = {};
    private stopHistoryListener: any;
    private setRerender: Function | null = null;

    constructor(public name: string, public settingsId: string) {}

    pushSettings = async () => {
        Object.entries(this.settingsFields).forEach(([nameId, field]) => {
            if (field.type !== "button" && this.getFieldValue(nameId) === undefined) {
                this.setFieldValue(nameId, field.defaultValue);
            }
        });

        while (!Spicetify?.Platform?.History?.listen) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        if (this.stopHistoryListener) this.stopHistoryListener();

        this.stopHistoryListener = Spicetify.Platform.History.listen((e: any) => {
            if (e.pathname === "/preferences") {
                this.render();
            }
        });

        if (Spicetify.Platform.History.location.pathname === "/preferences") {
            await this.render();
        }
    };

    rerender = () => {
        if (this.setRerender) {
            this.setRerender(Math.random());
        }
    };

    private render = async () => {
        while (!document.getElementById("desktop.settings.selectLanguage")) {
            if (Spicetify.Platform.History.location.pathname !== "/preferences") return;
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const allSettingsContainer = document.querySelector(".main-view-container__scroll-node-child main div");
        if (!allSettingsContainer) return console.error("[spcr-settings] settings container not found");

        let pluginSettingsContainer = Array.from(allSettingsContainer.children).find((child) => child.id === this.settingsId);

        if (!pluginSettingsContainer) {
            pluginSettingsContainer = document.createElement("div");
            pluginSettingsContainer.id = this.settingsId;

            allSettingsContainer.appendChild(pluginSettingsContainer);
        } else {
            console.log(pluginSettingsContainer);
        }

        ReactDOM.render(<this.FieldsContainer />, pluginSettingsContainer);
    };

    addButton = (nameId: string, description: string, value: string, onClick?: () => void) => {
        this.settingsFields[nameId] = {
            type: "button",
            description: description,
            value: value,
            events: {
                onClick: onClick
            }
        };
    };

    addToggle = (nameId: string, description: string, defaultValue: boolean, onChange?: () => void) => {
        this.settingsFields[nameId] = {
            type: "toggle",
            description: description,
            defaultValue: defaultValue,
            events: {
                onChange: onChange
            }
        };
    };

    getFieldValue = <Type,>(nameId: string): Type => {
        return JSON.parse(Spicetify.LocalStorage.get(`${this.settingsId}.${nameId}`) || "{}")?.value;
    };

    setFieldValue = (nameId: string, newValue: any) => {
        Spicetify.LocalStorage.set(`${this.settingsId}.${nameId}`, JSON.stringify({ value: newValue }));
    };

    private FieldsContainer = () => {
        const [rerender, setRerender] = useState<number>(0);
        this.setRerender = setRerender;

        return (
            <div className="x-settings-section" key={rerender}>
                <h2 className="e-9640-text encore-text-body-medium-bold encore-internal-color-text-base">{this.name}</h2>
                {Object.entries(this.settingsFields).map(([nameId, field]) => {
                    return <this.Field nameId={nameId} field={field} />;
                })}
            </div>
        );
    };

    private Field = (props: { nameId: string; field: ISettingsField }) => {
        const id = `${this.settingsId}.${props.nameId}`;

        let defaultStateValue;
        if (props.field.type === "button") {
            defaultStateValue = props.field.value;
        } else {
            defaultStateValue = this.getFieldValue(props.nameId);
        }

        const [value, setValueState] = useState(defaultStateValue);

        const setValue = (newValue?: any) => {
            if (newValue !== undefined) {
                setValueState(newValue);
                this.setFieldValue(props.nameId!, newValue);
            }
        };

        return (
            <div className="x-settings-row">
                <div className="x-settings-firstColumn">
                    <label className="e-9640-text encore-text-body-small encore-internal-color-text-subdued" htmlFor={id}>
                        {props.field.description || ""}
                    </label>
                </div>
                <div className="x-settings-secondColumn">
                    {props.field.type === "button" ? (
                        <span>
                            <button
                                id={id}
                                className="Button-sc-y0gtbx-0 Button-buttonSecondary-small-useBrowserDefaultFocusStyle encore-text-body-small-bold e-9640-button--small x-settings-button"
                                {...props.field.events}
                                onClick={(e) => {
                                    setValue();
                                    const onClick = (props.field as ISettingsFieldButton).events?.onClick;
                                    if (onClick) onClick(e);
                                }}
                                type="button"
                            >
                                {value}
                            </button>
                        </span>
                    ) : props.field.type === "toggle" ? (
                        <label className="x-toggle-wrapper">
                            <input
                                id={id}
                                className="x-toggle-input"
                                type="checkbox"
                                checked={value as boolean}
                                {...props.field.events}
                                onClick={(e) => {
                                    setValue(e.currentTarget.checked);
                                    const onClick = (props.field as ISettingsFieldToggle).events?.onClick;
                                    if (onClick) onClick(e);
                                }}
                            />
                            <span className="x-toggle-indicatorWrapper">
                                <span className="x-toggle-indicator"></span>
                            </span>
                        </label>
                    ) : (
                        <></>
                    )}
                </div>
            </div>
        );
    };
}

export { SettingsSection };
