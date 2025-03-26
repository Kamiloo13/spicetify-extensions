export interface ISettingsFieldButton {
    type: "button";
    description?: string;
    value: any;
    events?: Partial<React.ButtonHTMLAttributes<HTMLButtonElement>>;
}

export interface ISettingsFieldToggle {
    type: "toggle";
    description?: string;
    defaultValue: boolean;
    events?: Partial<React.InputHTMLAttributes<HTMLInputElement>>;
}

export type ISettingsField = ISettingsFieldButton | ISettingsFieldToggle;

export type NewValueTypes = boolean | string;
