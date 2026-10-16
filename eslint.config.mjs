import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// RULES §1: every styling value comes from design/tokens.css.
const noHardcodedStyle = [
  {
    selector: "JSXAttribute[name.name='style']",
    message: "RULES §1: no inline styles. Use design tokens.",
  },
  {
    selector: "Literal[value=/#(?:[0-9a-fA-F]{3}){1,2}\\b|#[0-9a-fA-F]{8}\\b/]",
    message: "RULES §1: no hex colours. Use a token class.",
  },
  {
    selector: "Literal[value=/\\b(?:rgba?|hsla?|oklch|oklab)\\(/]",
    message: "RULES §1: no colour functions. Use a token class.",
  },
  {
    selector: "Literal[value=/-\\[[^\\]]+\\](?!:)/]",
    message: "RULES §1: no arbitrary Tailwind values. Add a token in design/tokens.css.",
  },
  {
    selector: "TemplateElement[value.raw=/-\\[[^\\]]+\\](?!:)/]",
    message: "RULES §1: no arbitrary Tailwind values.",
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: { "no-restricted-syntax": ["error", ...noHardcodedStyle] },
  },
  // RULES §3: each external service SDK is imported only inside its folder.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/db/**", "src/lib/auth/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["convex/*", "convex", "**/convex/_generated/*"],
              message: "RULES §3: import Convex only in src/lib/db.",
            },
            {
              group: ["@clerk/*"],
              message: "RULES §3: import Clerk only in src/lib/auth.",
            },
          ],
        },
      ],
    },
  },
  // RULES §4: business logic stays pure TypeScript.
  {
    files: ["src/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "react",
                "react/*",
                "next",
                "next/*",
                "convex",
                "convex/*",
                "@clerk/*",
                "@/lib/*",
                "@/components/*",
              ],
              message: "src/domain must stay pure TypeScript.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "convex/_generated/**",
  ]),
]);

export default eslintConfig;
