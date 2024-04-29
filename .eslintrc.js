module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2021: true,
  },
  extends: "eslint:recommended",
  overrides: [
    {
      env: {
        node: true,
      },
      files: [".eslintrc.{js,cjs}"],
      parserOptions: {
        sourceType: "script",
      },
    },
  ],
  parserOptions: {
    ecmaVersion: "latest",
  },
  rules: {
    "unused-imports/no-unused-imports": "error",
    "simple-import-sort/exports": "warn",
    "simple-import-sort/imports": [
      "warn",
      {
        groups: [
          ["^react$"],
          ["^\\u0000"],
          ["^@?\\w"],
          ["^components(/.*|$)"],
          ["^containers(/.*|$)"],
          ["^(types|utils|api|config|styles|pages)(/.*|$)"],
          ["^\\."],
        ],
      },
    ],
    "no-unused-vars": "off",
  },
};
