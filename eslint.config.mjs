import tseslint from "typescript-eslint";

let mergedRules = {};

tseslint.configs.recommended.forEach((ruleset) => {
    if (ruleset.rules !== undefined) {
        Object.assign(mergedRules, ruleset.rules);
    }
});

Object.assign(mergedRules, {
    "@typescript-eslint/no-explicit-any": "off"
});

export default [
    {
        name: "typescript-eslint",
        files: ["**/*.ts"],
        ignores: ["**/*.d.ts", "shared/**/*"],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                project: "./tsconfig.json"
            }
        },
        plugins: {
            "@typescript-eslint": tseslint.plugin
        },
        rules: mergedRules
    }
];
