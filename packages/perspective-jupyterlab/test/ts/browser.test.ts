import "isomorphic-fetch";
// import * as puppeteer from"puppeteer";
// import * as path from "path";

describe('Checks browser interactions', () => {
    test("Check extension", () => {

    });
    // test("Check extension", async () => {
    //     const browser = await puppeteer.launch({args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", '--proxy-server="direct://"', "--proxy-bypass-list=*"]});
    //     const page = await browser.newPage();
    //     await page.goto(`file://${path.resolve(__dirname, "..")}/html/test.html`);

    //     let x = await page.evaluate(() => {
    //         let y = document.createElement('perspective-viewer');
    //         return y.tagName;
    //     });

    //     await expect(x).toMatch('PERSPECTIVE-VIEWER');

    //     // x = await page.evaluate(() => {
    //     //     let y = document.getElementById('header');
    //     //     if(y)
    //     //         return y.tagName;
    //     //     else
    //     //         return '';
    //     // });

    //     // let z = await x;
    //     // expect(z).toMatch('div');

    //     page.close();
    //     browser.close();
    // });
});
