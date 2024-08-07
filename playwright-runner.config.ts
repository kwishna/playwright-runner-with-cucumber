import { defineConfig, devices } from '@playwright/test';
import { config } from "dotenv";
import { resolve } from 'path';
import os from 'os';
import process from 'process';
config({ path: resolve(".env") })


/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  build: { external: ["node_modules"] },
  expect: {
    timeout: 10000,
    toHaveScreenshot: { threshold: 0.6, scale: "device", caret: "hide", animations: "disabled" },
    toMatchSnapshot: { threshold: 0.6, maxDiffPixelRatio: 0.4 },
  },
  globalSetup: "./global.setup.ts", // execute only once before all the tests.
  // globalTeardown: "./global.teardown.ts", // This file will be required and run after all the tests.
  globalTimeout: process.env.CI ? 60 * 60 * 1000 : 0, // Maximum time in milliseconds the whole test suite can run.
  // testDir: './test', // Directory that will be recursively scanned for test files.
  ignoreSnapshots: false, // Whether to skip snapshot expectations.
  // snapshotPathTemplate: ''
  /*
   Whether to update expected snapshots with the actual results produced by the test run. Defaults to 'missing'.
  'all' - All tests that are executed will update snapshots that did not match. Matching snapshots will not be updated.
  'none' - No snapshots are updated.
  'missing' - Missing snapshots are created, for example when authoring a new test and running it for the first time.
  */
  updateSnapshots: 'missing',
  metadata: {
    "name": os.hostname(),
  },
  name: "Playwright Test Report", //Config name is visible in the report and during test execution.
  outputDir: "playwright-report", // The output directory for files created during test execution.
  preserveOutput: 'always', // Whether to preserve test output in the testConfig.outputDir.
  quiet: false, // Whether to suppress stdio and stderr output from the tests.
  maxFailures: 0, // The maximum number of test failures for the whole test suite run. After reaching this number, testing will stop and exit with an error.
  // repeatEach: 3, // To find flaky tests
  reportSlowTests: {
    max: 10,  // Report max 10 tests.
    threshold: 6 * 60000, // Test runnning longer than 6 minutes will be marked as slow.
  },
  respectGitIgnore: true, // Whether to skip entries from .gitignore when searching for test files.
  snapshotDir: './snapshots', // The base directory, relative to the config file, for snapshot files created with toMatchSnapshot. 
  testIgnore: '**\/src/**', // Ignore files in 'src' directory.
  timeout: 5 * 60 * 1000, // Timeout for each test in milliseconds. Defaults to 30 seconds.

  // snapshotPathTemplate: "", // This option configures a template controlling location of snapshots generated by expect(page).toHaveScreenshot(name[, options]) and expect(value).toMatchSnapshot(name[, options]).
  testMatch: "**\/*.@(spec|test).?(c|m)[jt]s?(x)",
  /*
  Playwright Test runs tests in parallel. In order to achieve that, it runs several worker processes that run at the same time.
  By default, test files are run in parallel. Tests in a single file are run in order, in the same worker process.
  */
  fullyParallel: false, // 
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 4 : 4,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { fileName: 'playwright-report.html', outputDir: 'playwright-report' }],
    ['junit', { fileName: 'playwright-junit.xml', outputDir: 'playwright-report' }],
    ['json', { fileName: 'playwright-json.json', outputDir: 'playwright-report' }],
    ['blob', { outputFile: `report-${os.platform()}.zip`, outputDir: 'playwright-report' }],
    ['allure-playwright', { detail: true, outputFolder: 'my-allure-results', suiteTitle: false }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'https://the-internet.herokuapp.com/',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  // Tests will execute for each project. As per respective configuration
  projects: [
    {
      name: 'setup',
      testMatch: /setup\.spec\.ts/,
      testDir: "test",
    },
    {
      name: 'teardown',
      testMatch: /teardown\.spec\.ts/,
      testDir: "test",
    },
    {
      name: 'regression',
      dependencies: ['setup'],
      teardown: 'teardown',
      grep: /demo-todo/,
      timeout: 20 * 60 * 10000, // 20 minutes max
      testDir: "test/regression",
      // testIgnore: '',
      // testMatch: '',
      use: {
        baseURL: "https://playwright.dev/",
        ...devices['Desktop Chrome'],
        browserName: "chromium",
        acceptDownloads: true,
        actionTimeout: 10 * 1000,
        navigationTimeout: 30 * 1000,
        headless: true,
        javaScriptEnabled: true,
        viewport: { width: 1920, height: 1080 },
        screenshot: { fullPage: true, mode: "only-on-failure", omitBackground: false },
        trace: { mode: 'retain-on-failure', attachments: true, screenshots: true, sources: true, snapshots: true },
        video: { mode: "retain-on-failure", size: { height: 1080, width: 1920 } },
        launchOptions: { timeout: 30000, downloadsPath: "./downloads", args: ['--window-position=-5,-5'] },
      },
    },
    {
      name: 'smoke',
      dependencies: ['setup'], // List of projects that need to run before any test in this project runs.
      teardown: 'teardown', // Name of a project that needs to run after this and all dependent projects have finished.
      grep: /example/, // Filter to only run tests with a title matching one of the patterns.
      timeout: 2 * 60 * 10000, // 2 minutes max. Timeout for each test in milliseconds. 
      testDir: "test/smoke", // Directory that will be recursively scanned for test files.
      use: {
        baseURL: "https://playwright.dev/",
        ...devices['Desktop Chrome'],
        acceptDownloads: true, // Whether to automatically download all the attachments.
        actionTimeout: 10 * 1000, // Default timeout for each Playwright action in milliseconds
        headless: true, // Whether to run browser in headless mode. 
        // httpCredentials: {
        //   username: 'user',
        //   password: 'pass'
        // },
        javaScriptEnabled: true, // Whether or not to enable JavaScript in the context. 
        navigationTimeout: 30 * 1000, // Timeout for each navigation action in milliseconds.
        launchOptions: { timeout: 30000, downloadsPath: "./downloads", args: ['--window-position=-5,-5'], slowMo: 2 },
        // permissions: ['clipboard'],
        screenshot: { fullPage: true, mode: "only-on-failure", omitBackground: false },
        trace: { mode: 'retain-on-failure', attachments: true, screenshots: true, sources: true, snapshots: true },
        video: { mode: "retain-on-failure", size: { height: 1080, width: 1920 } },
        viewport: { width: 1920, height: 1080 },
        // connectOptions: { wsEndpoint: '', exposeNetwork: "127.0.0.1", timeout: 30000, headers: {} },
        browserName: "chromium",
        // baseURL: "https://the-internet.herokuapp.com/" // already defined globally,
        colorScheme: 'dark',
        bypassCSP: false, // Toggles bypassing page's Content-Security-Policy.
        ignoreHTTPSErrors: true // Whether to ignore HTTPS errors when sending network requests.
      },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
