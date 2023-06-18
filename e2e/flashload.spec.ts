import { expect, test } from "@playwright/test";


test.describe("Flashload", () => {

    test('simple navigation', async ({page}) => {

        await page.goto('/tests/simple/page1.html');

        page.on('request', async request => {
            // XMLHttpRequest
            await expect(request.url()).toContain('/page2.html');
            await expect(request.method()).toBe('GET');
            await expect(request.headers()['x-flashload']).toBe('1');
        })

        // click on a link (should load via flashload)
        await page.getByText('Page 2').click();

        await expect(page.url()).toContain('/page2.html');
        await expect(page.locator('h1')).toHaveText('Oh, Hi!');
    });

    test('404', async ({page}) => {

        await page.goto('/tests/404/page1.html');

        let isFirst = true;

        page.on('request', async request => {
            // XMLHttpRequest
            await expect(request.url()).toContain('/page2.html');
            await expect(request.method()).toBe('GET');

            /**
             * First request should have the x-flashload header
             * When it fails with 404, the second request is a normal full page load
             */
            await expect(request.headers()['x-flashload']).toBe(isFirst ? '1' : undefined);
            isFirst = false;
        })

        page.on('response', async response => {
            await expect(response.url()).toContain('/page2.html');
            await expect(response.status()).toBe(404);
        });

        await page.getByText('Page 2').click();
        await expect(page.url()).toContain('/page2.html');

    });


    test('scroll',async ({page}) => {

        await page.goto('/tests/scroll/scrolled.html');

        await page.evaluate(() => window.scrollTo(
            0,
            window.document.getElementById("scroll-here")!.getBoundingClientRect().top    
        ));

        await expect(page.locator('h1#scroll-here')).toBeInViewport();

        await page.getByText('Go Other').click();

        await expect(page.getByText('Other Page')).toBeVisible();

        await page.getByText('back').click();

        await expect(page.url()).toContain('scrolled.html');
    
        await expect(page.locator('h1#scroll-here')).toBeInViewport();

    })

    test('hash', async ({page}) => {

        await page.goto('/tests/hash/index.html');

        await page.getByText('To hash').click();
        await expect(page.url()).toContain('hash.html#hash');
        await expect(page.locator('h1#hash')).toBeInViewport();

        await page.goBack();
        await expect(page.url()).toContain('index.html');

        await page.getByText('To not hash').click();
        await expect(page.url()).not.toContain('#hash');
        await expect(page.locator('h1#hash')).not.toBeInViewport();

        const scrollY = await page.evaluate(() => window.scrollY);
        await expect(scrollY).toBe(0);

    });

    test('running scripts and ignoring data-flashload-skip-script', async ({page}) => {

        let alerts : string[] = [];

        await page.exposeFunction('alertMock', (alert: string) => alerts.push(alert));
        await page.addInitScript(() => {
            window.alert = (window as any).alertMock;
        });

        await page.goto('/tests/script/index.html');
        await page.getByText('Go').click();

        await expect(page.getByText('Scripts ran')).toBeVisible();

        await expect(alerts).toEqual(['script1']);
    });

    test('basepath', async ({page}) => {

        await page.goto('/tests/basepath/index.html');

        let requestListener = async (request) => {
            await expect(request.url()).toContain('/tests/basepath/other.html');
            await expect(request.headers()['x-flashload']).toBeUndefined(); // should not be flashload
        };
        page.on('request', requestListener);

        await page.getByText('To other.html').click();
        await expect(page.getByText('This other page should be reloaded')).toBeVisible();

        page.off('request', requestListener);

        await page.goBack();

        requestListener = async (request) => {
            await expect(request.url()).toContain('/tests/basepath/blog/blog.html');
            await expect(request.headers()['x-flashload']).toBe('1'); // should be flashload
        }
        page.on('request', requestListener);

        await page.getByText('To /blog/blog').click();
        await expect(page.getByText('This is blog page')).toBeVisible();

    });

    test('html attributes', async ({page}) => {

        await page.goto('/tests/html-attributes/index.html');

        await page.getByText('To RTL').click();

        await expect(page.getByText('RTL Page')).toBeVisible();

        const dir = await page.evaluate(() => document.documentElement.getAttribute('dir'));
        await expect(dir).toBe('rtl');

        await page.goBack();

        const dirNew = await page.evaluate(() => document.documentElement.getAttribute('dir'));
        await expect(dirNew).toBe('ltr');

    });

    // TODO: test for bar
    // TODO: test for exclude
    // TODO: test for events
    // TODO: test for data-flashload-skip-link    
    // TODO: test for cache


});