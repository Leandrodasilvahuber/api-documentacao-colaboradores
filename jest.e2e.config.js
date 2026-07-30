const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  testMatch: ["<rootDir>/e2e/**/*.e2e.test.ts"],
  globalSetup: "<rootDir>/e2e/setup/globalSetup.ts",
  setupFiles: ["<rootDir>/e2e/setup/env.ts"],
  testTimeout: 30000,
};
