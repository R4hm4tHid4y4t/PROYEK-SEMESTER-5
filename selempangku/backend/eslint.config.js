const js = require("@eslint/js");
const globals = require("globals");
const promisePlugin = require("eslint-plugin-promise");
const unusedImports = require("eslint-plugin-unused-imports");

module.exports = [
  {
    ignores: ["node_modules/**"],
  },

  js.configs.recommended,

  {
    // Daftarkan plugin di sini
    plugins: {
      promise: promisePlugin,
      "unused-imports": unusedImports,
    },

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node
      }
    },

    rules: {
      "no-console": "off",

      // --- ATURAN PROMISE ---
      // Menggunakan aturan rekomendasi dari eslint-plugin-promise
      ...promisePlugin.configs.recommended.rules,

      // --- ATURAN UNUSED IMPORTS ---
      // 1. Matikan aturan bawaan 'no-unused-vars' agar tidak bentrok/double report
      "no-unused-vars": "off",

      // 2. Aturan untuk Import yang tidak terpakai (biasanya diset error agar bersih)
      "unused-imports/no-unused-imports": "error",

      // 3. Aturan untuk Variabel yang tidak terpakai (pengganti no-unused-vars)
      "unused-imports/no-unused-vars": [
        "warn",
        {
          "vars": "all",
          "varsIgnorePattern": "^_",
          "args": "after-used",
          "argsIgnorePattern": "^_"
        }
      ]
    }
  }
];