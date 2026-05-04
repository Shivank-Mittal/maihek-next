import { test, expect } from '@playwright/test';
import { PageConstants } from '../constants';

test("should show the correct title on the Maihak page", async ({page}) => {
    const pageName = PageConstants.MAIHAK;
    await page.goto(pageName);

    const title = await page.title();

    await expect(title).toContain("MAIHAK")
})  

test("should show the correct title on the Maihak menu page", async ({page}) => {
    const pageName = PageConstants.MENU;
    await page.goto(pageName);

    const title = await page.title();

    await expect(title).toContain("MAIHAK")
})  


test("should show the correct title on the Maihak login page", async ({page}) => {
    const pageName = PageConstants.LOGIN;
    await page.goto(pageName);

    const title = await page.title();

    await expect(title).toContain("MAIHAK")
})  


test("should redirect to the login page if not logged in", async ({page}) => {
    const pageName = PageConstants.DASHBOARD;
    await page.goto(pageName);

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });


   const title = await page.title();

    await expect(title).toContain("MAIHAK")
})


