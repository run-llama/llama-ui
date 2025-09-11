import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

const rules = {
  // React Hooks
  ...reactHooks.configs.recommended.rules,

  // TypeScript
  "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
  "@typescript-eslint/no-explicit-any": "warn",

  // React
  "react/prop-types": "off",
  "react/react-in-jsx-scope": "off",

  // basic rules
  "no-console": "warn",
  "prefer-const": "error",
};

const plugins = {
  "@typescript-eslint": tseslint.plugin,
  react,
  "react-hooks": reactHooks,
};

// Align with tsconfig.json
const languageOptions = {
  parser: tseslint.parser,
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: "module",
    projectService: true,
  },
};

const settings = {
  react: {
    version: "detect",
  },
};

export default [
  ...tseslint.configs.recommended.map((c) => ({
    ...c,
    files: ["src/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}", "base/**/*.{ts,tsx}"],
  })),
  {
    files: ["stories/**/*.{ts,tsx}"],
    plugins,
    languageOptions,
    rules: {
      ...rules,
      "no-console": "off",
    },
    settings,
  },
  {
    files: ["src/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}", "base/**/*.{ts,tsx}"],
    languageOptions,
    plugins,
    rules,
    settings,
  },
  {
    ignores: ["dist/**/*", "node_modules/**/*", "storybook-static/**/*"],
  },
];
