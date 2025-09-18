/**
 * @file SettingsSection.tsx
 * @description This code has been copied from (spcr-settings) and it has been modified to suit the needs of Simple Beautiful Lyrics.
 */

import React, { useState } from "react";
import ReactDOM from "react-dom";
import { ISettingsField, ISettingsFieldButton, ISettingsFieldDropdown, ISettingsFieldInput, ISettingsFieldToggle } from "../types/settings-field";

class SettingsSection {
    private settingsFields: { [nameId: string]: ISettingsField } = {};
    private stopHistoryListener: any;
    private setRerender: Function | null = null;
    private areClassNamesInitialized = false;
    private spotifyClasses: Record<string, string> = {};

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

    private getClassByPath = (container: HTMLElement, path: number[], fallback: string) => {
        try {
            let node: HTMLElement = container;
            for (const idx of path) {
                if (!node?.childNodes?.[idx]) return fallback;
                node = node.childNodes[idx] as HTMLElement;
            }
            return node.className || fallback;
        } catch (error) {
            console.error("[spcr-settings] Error getting class by path:", error);
            return fallback;
        }
    };

    private initSpotifyClasses = (allSettingsContainer: HTMLDivElement) => {
        if (this.areClassNamesInitialized) return;

        this.spotifyClasses = {
            settingsSection: this.getClassByPath(allSettingsContainer, [1], "x-settings-section"),
            sectionTitle: this.getClassByPath(allSettingsContainer, [1, 0], "e-91000-text encore-text-body-medium-bold encore-internal-color-text-base"),
            settingsRow: this.getClassByPath(allSettingsContainer, [1, 1], "x-settings-row"),
            firstColumn: this.getClassByPath(allSettingsContainer, [1, 1, 0], "x-settings-firstColumn"),
            settingLabel: this.getClassByPath(allSettingsContainer, [1, 1, 0, 0], "e-91000-text encore-text-body-small encore-internal-color-text-subdued"),
            secondColumn: this.getClassByPath(allSettingsContainer, [1, 1, 1], "x-settings-secondColumn"),
            button: this.getClassByPath(
                allSettingsContainer,
                [8, 4, 0],
                "Button-sc-y0gtbx-0 Button-buttonSecondary-small-useBrowserDefaultFocusStyle encore-text-body-small-bold e-9640-button--small x-settings-button"
            ),
            toggleDivWrapper: this.getClassByPath(allSettingsContainer, [3, 1, 1, 0], ""),
            toggleWrapper: this.getClassByPath(allSettingsContainer, [3, 1, 1, 0, 0], "x-toggle-wrapper"),
            toggleInput: this.getClassByPath(allSettingsContainer, [3, 1, 1, 0, 0, 0], "x-toggle-input"),
            toggleIndicatorWrapper: this.getClassByPath(allSettingsContainer, [3, 1, 1, 0, 0, 1], "x-toggle-indicatorWrapper"),
            toggleIndicator: this.getClassByPath(allSettingsContainer, [3, 1, 1, 0, 0, 1, 0], "x-toggle-indicator"),
            mainDropDown: this.getClassByPath(allSettingsContainer, [5, 1, 1, 0, 0], "main-dropDown-dropDown"),
            textInput: "e-91000-form-input e-91000-baseline e-91000-form-control encore-text-body-medium main-topBar-searchBar Mx356zpxhMqMxje_7QXv",
            settingsSingleColumn: this.getClassByPath(allSettingsContainer, [13, 1], "k5yrn4bTRFh4dMUyEtX2"),
            groupContainer: this.getClassByPath(allSettingsContainer, [13, 1, 0], "Group-sc-u9bcx5-0 Group-formGroup rSF8UwLzWlq43BzcPjy9"),
            groupLabel: this.getClassByPath(allSettingsContainer, [13, 1, 0, 0], "LabelGroup-sc-1ibddrg-0 LabelGroup encore-text-body-small-bold"),
            labelContainer: this.getClassByPath(allSettingsContainer, [13, 1, 0, 0, 0], "Label-sc-1c0cv3r-0 klvvqC"),
            labelInner: this.getClassByPath(allSettingsContainer, [13, 1, 0, 0, 0, 0], "LabelInner-sc-19pye2k-0 cCdxWn")
        };

        this.areClassNamesInitialized = true;
        console.log("[spcr-settings] Initialized Spotify class names:", this.spotifyClasses);
    };

    private render = async () => {
        while (!document.getElementById("desktop.settings.selectLanguage")) {
            if (Spicetify.Platform.History.location.pathname !== "/preferences") return;
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const allSettingsContainer = document.querySelector<HTMLDivElement>(".main-view-container__scroll-node-child main div");
        if (!allSettingsContainer) return console.error("[spcr-settings] settings container not found");

        this.initSpotifyClasses(allSettingsContainer);

        let pluginSettingsContainer = Array.from(allSettingsContainer.children).find((child) => child.id === this.settingsId);
        if (!pluginSettingsContainer) {
            pluginSettingsContainer = document.createElement("div");
            pluginSettingsContainer.id = this.settingsId;

            allSettingsContainer.appendChild(pluginSettingsContainer);
        }

        // @ts-ignore - React deprecation error (we can ignore it)
        ReactDOM.render(<this.FieldsContainer />, pluginSettingsContainer);
    };

    addButton = (nameId: string, description: string, value: string, onClick?: () => void, events?: ISettingsFieldButton["events"]) => {
        this.settingsFields[nameId] = {
            type: "button",
            description: description,
            value: value,
            events: {
                onClick: onClick,
                ...events
            }
        };
    };

    addInput = (
        nameId: string,
        description: string,
        defaultValue: string,
        floatLeft?: boolean,
        onChange?: () => void,
        inputType?: string,
        events?: ISettingsFieldInput["events"]
    ) => {
        this.settingsFields[nameId] = {
            type: "input",
            description: description,
            defaultValue: defaultValue,
            inputType: inputType,
            floatLeft: floatLeft,
            events: {
                onChange: onChange,
                ...events
            }
        };
    };

    addHidden = (nameId: string, defaultValue: any) => {
        this.settingsFields[nameId] = {
            type: "hidden",
            defaultValue: defaultValue
        };
    };

    addToggle = (nameId: string, description: string, defaultValue: boolean, onChange?: () => void, events?: ISettingsFieldToggle["events"]) => {
        this.settingsFields[nameId] = {
            type: "toggle",
            description: description,
            defaultValue: defaultValue,
            events: {
                onChange: onChange,
                ...events
            }
        };
    };

    addDropDown = (
        nameId: string,
        description: string,
        options: string[],
        defaultIndex: number,
        floatLeft?: boolean,
        onSelect?: () => void,
        events?: ISettingsFieldDropdown["events"]
    ) => {
        this.settingsFields[nameId] = {
            type: "dropdown",
            description: description,
            defaultValue: options[defaultIndex],
            options: options,
            floatLeft: floatLeft,
            events: {
                onSelect: onSelect,
                ...events
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
            <div className={this.spotifyClasses.settingsSection} key={rerender}>
                <h2 className={this.spotifyClasses.sectionTitle}>{this.name}</h2>
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

        if (props.field.type === "hidden") {
            return <></>;
        }

        const [value, setValueState] = useState(defaultStateValue);

        const setValue = (newValue?: any) => {
            if (newValue !== undefined) {
                setValueState(newValue);
                this.setFieldValue(props.nameId!, newValue);
            }
        };

        if ((props.field.type === "input" || props.field.type === "dropdown") && props.field.floatLeft) {
            return (
                <div className={this.spotifyClasses.settingsSingleColumn}>
                    <div className={this.spotifyClasses.groupContainer}>
                        <div className={this.spotifyClasses.groupLabel}>
                            <label className={this.spotifyClasses.labelContainer} htmlFor={id}>
                                <span className={this.spotifyClasses.labelInner}>{props.field.description || ""}</span>
                            </label>
                        </div>
                        {props.field.type === "input" ? (
                            <input
                                className={this.spotifyClasses.textInput}
                                id={id}
                                dir="ltr"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck={false}
                                value={value as string}
                                type={props.field.inputType || "text"}
                                placeholder={(props.field as ISettingsFieldInput).defaultValue}
                                {...props.field.events}
                                onChange={(e) => {
                                    setValue(e.currentTarget.value);
                                    const onChange = (props.field as ISettingsFieldInput).events?.onChange;
                                    if (onChange) onChange(e);
                                }}
                            />
                        ) : (
                            <span>
                                <select
                                    className={this.spotifyClasses.mainDropDown}
                                    id={id}
                                    {...props.field.events}
                                    onChange={(e) => {
                                        setValue((props.field as ISettingsFieldDropdown).options[e.currentTarget.selectedIndex]);
                                        const onChange = (props.field as ISettingsFieldDropdown).events?.onChange;
                                        if (onChange) onChange(e);
                                    }}
                                >
                                    {props.field.options.map((option, i) => {
                                        return (
                                            <option selected={option === value} value={i + 1}>
                                                {option}
                                            </option>
                                        );
                                    })}
                                </select>
                            </span>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className={this.spotifyClasses.settingsRow}>
                <div className={this.spotifyClasses.firstColumn}>
                    <label className={this.spotifyClasses.settingLabel} htmlFor={id}>
                        {props.field.description || ""}
                    </label>
                </div>
                <div className={this.spotifyClasses.secondColumn}>
                    {props.field.type === "input" ? (
                        <input
                            className={this.spotifyClasses.textInput}
                            id={id}
                            dir="ltr"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            value={value as string}
                            type={props.field.inputType || "text"}
                            placeholder={(props.field as ISettingsFieldInput).defaultValue}
                            {...props.field.events}
                            onChange={(e) => {
                                setValue(e.currentTarget.value);
                                const onChange = (props.field as ISettingsFieldInput).events?.onChange;
                                if (onChange) onChange(e);
                            }}
                        />
                    ) : props.field.type === "button" ? (
                        <span>
                            <button
                                id={id}
                                className={this.spotifyClasses.button}
                                data-encore-id="buttonSecondary"
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
                        <div className={this.spotifyClasses.toggleDivWrapper}>
                            <label className={this.spotifyClasses.toggleWrapper}>
                                <input
                                    id={id}
                                    className={this.spotifyClasses.toggleInput}
                                    type="checkbox"
                                    checked={value as boolean}
                                    {...props.field.events}
                                    onClick={(e) => {
                                        setValue(e.currentTarget.checked);
                                        const onClick = (props.field as ISettingsFieldToggle).events?.onClick;
                                        if (onClick) onClick(e);
                                    }}
                                />
                                <span className={this.spotifyClasses.toggleIndicatorWrapper}>
                                    <span className={this.spotifyClasses.toggleIndicator}></span>
                                </span>
                            </label>
                        </div>
                    ) : props.field.type === "dropdown" ? (
                        <span>
                            <select
                                className={this.spotifyClasses.mainDropDown}
                                id={id}
                                {...props.field.events}
                                onChange={(e) => {
                                    setValue((props.field as ISettingsFieldDropdown).options[e.currentTarget.selectedIndex]);
                                    const onChange = (props.field as ISettingsFieldDropdown).events?.onChange;
                                    if (onChange) onChange(e);
                                }}
                            >
                                {props.field.options.map((option, i) => {
                                    return (
                                        <option selected={option === value} value={i + 1}>
                                            {option}
                                        </option>
                                    );
                                })}
                            </select>
                        </span>
                    ) : (
                        <></>
                    )}
                </div>
            </div>
        );
    };
}

export { SettingsSection };
