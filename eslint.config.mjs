import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      ".worker/**",
      "coverage/**",
      "output/playwright/**",
      "node_modules/**",
      "vendor/**",
      "**/__tests__/**",
      "**/*.test.*",
      "jest.config.js",
      "tailwind.config.ts",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      "no-var": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;
