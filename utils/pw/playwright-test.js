"use strict";

import assert from 'assert';
import playwright from 'playwright';
import fs from 'fs'

(async () => {
    // Setup
    const browser = await playwright.firefox.launch({ headless: false });
    const context = await browser.newContext(playwright.devices['Desktop Chrome']);
    const page = await context.newPage();

    // The actual interesting bit
    await context.route('**.jpg', route => route.abort());
    await context.route('**.png', route => route.abort());
    await page.goto('https://www.banrep.gov.co/es/normatividad?combine=&field_date_format_value%5Bmin%5D=2022-04-01&field_date_format_value%5Bmax%5D=2022-10-16', { waitUntil: 'networkidle' });
    await page.locator("[data-entity-uuid]").waitFor({ timeout: 60000 })
    let title = await page.title();
    let html = await page.content();
    console.log(JSON.stringify({ title, html }, null, 4));
    assert(title === 'Example Domain'); // 👎 not a Web First assertion

    // Teardown
    await context.close();
    await browser.close();
})()
