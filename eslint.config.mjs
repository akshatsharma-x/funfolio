import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Stubs (lib/juice.ts, lib/sfx.ts) keep their final signatures; `_`-prefixed names are intentionally unused.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      // R2 — the cursor must always be locatable.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@react-three/drei",
              importNames: ["useCursor"],
              message: "R2: drei's useCursor writes document.body.style.cursor and wipes the pixel cursors — use useGameCursor() from @/lib/hooks/useGameCursor.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "Property[key.name='cursor'][value.value='none']",
          message: "R2: never hide the cursor (no \"none\" cursor value).",
        },
        {
          selector: "AssignmentExpression[left.property.name='cursor']",
          message: "R2: don't write element.style.cursor — use data-cursor attributes or useGameCursor().",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
