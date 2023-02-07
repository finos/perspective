import { test, expect, defineConfig } from "@playwright/test";

// export default defineConfig({
//     webServer: {
//         command: "", //"npm run start blocks",
//         url: "http://localhost:8080",
//         timeout: 120 * 1000,
//         reuseExistingServer: !process.env.CI,
//     },
//     use: {
//         // TODO:
//         baseURL: "http://localhost:8080",
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
