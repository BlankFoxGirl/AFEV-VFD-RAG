const puppeteer = require('puppeteer');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const HOME_PATH = '/';
const LOGIN_PATH = '/login';
const API_LOGIN_PATH = '/api/auth/login';

const VALID_EMAIL = 'user@example.com';
const VALID_PASSWORD = 'SecurePass1';

async function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

async function navigateToHome(page) {
  await page.goto(`${FRONTEND_URL}${HOME_PATH}`, { waitUntil: 'networkidle0' });
}

async function navigateToLogin(page) {
  await page.goto(`${FRONTEND_URL}${LOGIN_PATH}`, { waitUntil: 'networkidle0' });
}

async function interceptLoginApiWith(page, { statusCode, body }) {
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request.url().includes(API_LOGIN_PATH) && request.method() === 'POST') {
      request.respond({
        status: statusCode,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    } else {
      request.continue();
    }
  });
}

async function getNavLinkHrefs(page) {
  return page.$$eval('nav.main-nav a.main-nav__link', (links) =>
    links.map((link) => link.getAttribute('href'))
  );
}

async function getNavLinkTexts(page) {
  return page.$$eval('nav.main-nav a.main-nav__link', (links) =>
    links.map((link) => link.textContent.trim())
  );
}

async function setAuthToken(page, token) {
  await page.evaluate((t) => localStorage.setItem('auth_token', t), token);
}

async function clearAuthToken(page) {
  await page.evaluate(() => localStorage.removeItem('auth_token'));
}

describe('Navigation Links E2E', () => {
  let browser;

  beforeAll(async () => {
    browser = await launchBrowser();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('unauthenticated navigation', () => {
    let page;

    beforeEach(async () => {
      page = await browser.newPage();
      await clearAuthToken(page);
      await navigateToHome(page);
    });

    afterEach(async () => {
      await page.close();
    });

    it('shows the Login link when unauthenticated', async () => {
      const hrefs = await getNavLinkHrefs(page);
      expect(hrefs).toContain('/login');
    });

    it('shows the Register link when unauthenticated', async () => {
      const hrefs = await getNavLinkHrefs(page);
      expect(hrefs).toContain('/register');
    });

    it('does not show the Profile link when unauthenticated', async () => {
      const hrefs = await getNavLinkHrefs(page);
      expect(hrefs).not.toContain('/profile');
    });
  });

  describe('authenticated navigation', () => {
    let page;

    beforeEach(async () => {
      page = await browser.newPage();
      await page.evaluateOnNewDocument(() => {
        localStorage.setItem('auth_token', 'mock-jwt-token');
      });
      await navigateToHome(page);
    });

    afterEach(async () => {
      await page.close();
    });

    it('shows the Profile link when authenticated', async () => {
      const hrefs = await getNavLinkHrefs(page);
      expect(hrefs).toContain('/profile');
    });

    it('shows the Register link when authenticated', async () => {
      const hrefs = await getNavLinkHrefs(page);
      expect(hrefs).toContain('/register');
    });

    it('does not show the Login link when authenticated', async () => {
      const hrefs = await getNavLinkHrefs(page);
      expect(hrefs).not.toContain('/login');
    });
  });

  describe('navigation link update after login', () => {
    let page;

    beforeEach(async () => {
      page = await browser.newPage();
    });

    afterEach(async () => {
      await page.close();
    });

    it('shows Profile link and hides Login link after successful login', async () => {
      await interceptLoginApiWith(page, {
        statusCode: 200,
        body: { success: true, user: { email: VALID_EMAIL }, token: 'new-jwt-token' },
      });

      await navigateToLogin(page);

      await page.type('#email', VALID_EMAIL);
      await page.type('#password', VALID_PASSWORD);

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
        page.click('button[type="submit"]'),
      ]);

      const hrefs = await getNavLinkHrefs(page);
      expect(hrefs).toContain('/profile');
      expect(hrefs).not.toContain('/login');
    });
  });
});
