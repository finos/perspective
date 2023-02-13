import { test, expect, defineConfig } from "@playwright/test";

// export default defineConfig({
//     webServer: {
//         command: "npm run start_testserver 6381 d3fc-specific-route", //"npm run start blocks",
//         port: 6381,
//         url: "http://localhost:6381",
//         timeout: 120 * 1000,
//         reuseExistingServer: !process.env.CI,
//     },
//     use: {
//         baseURL: "http://localhost:6381",
//     },
// });

test("Can access Editable", async ({ page }) => {
    await page.goto("/src/editable/index.html");

    const locator = page.locator("perspective-viewer");
    await locator.waitFor();
});

// test("has title", async ({ page }) => {
//     await page.goto("https://playwright.dev/");

//     // Expect a title "to contain" a substring.
//     await expect(page).toHaveTitle(/Playwright/);
// });

// test("get started link", async ({ page }) => {
//     await page.goto("https://playwright.dev/");

//     // Click the get started link.
//     await page.getByRole("link", { name: "Get started" }).click();

//     // Expects the URL to contain intro.
//     await expect(page).toHaveURL(/.*intro/);
// });
