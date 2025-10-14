import tseslint from "typescript-eslint";

export default tseslint.config({
  files: ["**/*.ts"],
  extends: [tseslint.configs.recommended],
  languageOptions: {
    parserOptions: {
      project: "./tsconfig.json",
      tsconfigRootDir: import.meta.dirname,
    },
  },
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "no-console": "off",
  },
});
