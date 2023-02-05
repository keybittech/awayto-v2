module.exports = {
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "../../tsconfig.json",
    "tsconfigRootDir": __dirname
  },
  "rules": {
    "@typescript-eslint/no-empty-interface": "off"
  },
  "settings": {
    "import/resolver": {
      "typescript": {},
      "alias": [
        ["awayto", "src/core/index.ts"],
        ["awayto-hooks", "src/webapp/hooks/index.ts"],
        ["route-match", "src/core/types/route-match.d.ts"]
      ]
    }
  },
  "plugins": [
    "@typescript-eslint",
    "import"
  ],
  "extends": [
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ]
}