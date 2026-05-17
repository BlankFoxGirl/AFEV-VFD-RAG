const puppeteer = require('puppeteer');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const HOME_PATH = '/';
const LOGIN_PATH = '/login';
const PROFILE_PATH = '/profile';
const DASHBOARD_PATH = '/dashboard';
const API_LOGIN_PATH = '/api/auth/login';
const API_PROFILE_PATH = '/api/profile';

const VALID_EMAIL = 'user@example.com';
const VALID_PASSWORD = 'SecurePass1';
const MOCK_TOKEN = 'mock-jwt-token';

const MOCK_PROFILE = {
  name: 'Test User',
  email: VALID_EMAIL,
  phone: '+1234567890',
  avatarUrl: null,
};

async function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

async function navigateTo(page, path) {
  await page.goto(`${FRONTEND_URL}${path}`, { waitUntil: 'networkidle0' });
}

async function getNavLinkHrefs(page) {
  return page.$$eval('nav.main-nav a.main-nav__link', (links) =>
    links.map((link) => link.getAttribute('href'))
  );
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

async function interceptProfileApiWith(page, { statusCode, body }) {
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request.url().includes(API_PROFILE_PATH) && request.method() === 'GET') {
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

async function interceptLoginAndProfileApis(page) {
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes(API_LOGIN_PATH) && request.method() === 'POST') {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, user: { email: VALID_EMAIL }, token: MOCK_TOKEN }),
      });
    } else if (url.includes(API_PROFILE_PATH) && request.method() === 'GET') {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: MOCK_PROFILE }),
      });
    } else {
      request.continue();
    }
  });
}

async function performLogin(page) {
  await navigateTo(page, LOGIN_PATH);
  await page.type('#email', VALID_EMAIL);
  await page.type('#password', VALID_PASSWORD);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
    page.click('button[type="submit"]'),
  ]);
}

async function clickNavLinkAndWaitForNavigation(page, href) {
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
    page.click(`nav.main-nav a.main-nav__link[href="${href}"]`),
  ]);
}

async function waitForPathname(page, pathname) {
  await page.waitForFunction(
    (path) => window.location.pathname === path,
    {},
    pathname
  );
}

describe('Navigation Flow E2E', () => {
  let browser;

  beforeAll(async () => {
    browser = await launchBrowser();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('unauthenticated access to protected routes', () => {
    let page;

    beforeEach(async () => {
      page = await browser.newPage();
    });

    afterEach(async () => {
      await page.close();
    });

    it('redirects to /login when accessing /profile without authentication', async () => {
      await interceptProfileApiWith(page, {
        statusCode: 401,
        body: { success: false, message: 'No session token provided.' },
      });

      await navigateTo(page, PROFILE_PATH);

      await waitForPathname(page, LOGIN_PATH);

      expect(page.url()).toContain(LOGIN_PATH);
    });

    it('includes the profile path as a redirect param when redirecting unauthenticated users', async () => {
      await interceptProfileApiWith(page, {
        statusCode: 401,
        body: { success: false, message: 'No session token provided.' },
      });

      await navigateTo(page, PROFILE_PATH);

      await waitForPathname(page, LOGIN_PATH);

      expect(page.url()).toContain('redirect=%2Fprofile');
    });

    it('redirects to /login when auth token is cleared before accessing /profile', async () => {
      await interceptProfileApiWith(page, {
        statusCode: 401,
        body: { success: false, message: 'Session has expired.' },
      });

      await page.evaluateOnNewDocument(() => {
        localStorage.removeItem('auth_token');
      });

      await navigateTo(page, PROFILE_PATH);

      await waitForPathname(page, LOGIN_PATH);

      expect(page.url()).toContain(LOGIN_PATH);
    });
  });

  describe('navigation links for unauthenticated users', () => {
    let page;

    beforeEach(async () => {
      page = await browser.newPage();
      await navigateTo(page, HOME_PATH);
    });

    afterEach(async () => {
      await page.close();
    });

    it('shows the Login link for unauthenticated users', async () => {
      const hrefs = await getNavLinkHrefs(page);
      expect(hrefs).toContain(LOGIN_PATH);
    });

    it('shows the Register link for unauthenticated users', async () => {
      const hrefs = await getNavLinkHrefs(page);
      expect(hrefs).toContain('/register');
    });

    it('does not show the Profile link for unauthenticated users', async () => {
      const hrefs = await getNavLinkHrefs(page);
      expect(hrefs).not.toContain(PROFILE_PATH);
    });
  });

  describe('navigation links for authenticated users', () => {
    let page;

    beforeEach(async () => {
      page = await browser.newPage();
      await page.evaluateOnNewDocument(() => {
        localStorage.setItem('auth_token', 'mock-jwt-token');
      });
      await navigateTo(page, HOME_PATH);
    });

    afterEach(async () => {
      await page.close();
    });

    it('shows the Profile link for authenticated users', async () => {
      const hrefs = await getNavLinkHrefs(page);
      expect(hrefs).toContain(PROFILE_PATH);
    });

    it('does not show the Login link for authenticated users', async () => {
      const hrefs = await getNavLinkHrefs(page);
      expect(hrefs).not.toContain(LOGIN_PATH);
    });

    it('shows the Register link for authenticated users', async () => {
      const hrefs = await getNavLinkHrefs(page);
      expect(hrefs).toContain('/register');
    });
  });

  describe('full navigation flow after login', () => {
    let page;

    beforeEach(async () => {
      page = await browser.newPage();
    });

    afterEach(async () => {
      await page.close();
    });

    it('redirects to /dashboard after successful login', async () => {
      await interceptLoginApiWith(page, {
        statusCode: 200,
        body: { success: true, user: { email: VALID_EMAIL }, token: MOCK_TOKEN },
      });

      await performLogin(page);

      expect(page.url()).toContain(DASHBOARD_PATH);
    });

    it('can navigate to profile page after login using the Profile nav link', async () => {
      await interceptLoginAndProfileApis(page);

      await performLogin(page);
      await clickNavLinkAndWaitForNavigation(page, PROFILE_PATH);

      await waitForPathname(page, PROFILE_PATH);

      expect(page.url()).toContain(PROFILE_PATH);
    });

    it('shows profile content when authenticated user navigates to profile via nav link', async () => {
      await interceptLoginAndProfileApis(page);

      await performLogin(page);
      await clickNavLinkAndWaitForNavigation(page, PROFILE_PATH);

      await page.waitForSelector('#name', { timeout: 10000 });
      const nameValue = await page.$eval('#name', (el) => el.value);

      expect(nameValue).toBe(MOCK_PROFILE.name);
    });

    it('can navigate back to dashboard from profile page using the Dashboard nav link', async () => {
      await interceptLoginAndProfileApis(page);

      await performLogin(page);
      await clickNavLinkAndWaitForNavigation(page, PROFILE_PATH);
      await waitForPathname(page, PROFILE_PATH);

      await clickNavLinkAndWaitForNavigation(page, DASHBOARD_PATH);

      expect(page.url()).toContain(DASHBOARD_PATH);
    });

    it('displays the Profile nav link after login', async () => {
      await interceptLoginApiWith(page, {
        statusCode: 200,
        body: { success: true, user: { email: VALID_EMAIL }, token: MOCK_TOKEN },
      });

      await performLogin(page);

      const hrefs = await getNavLinkHrefs(page);
      expect(hrefs).toContain(PROFILE_PATH);
      expect(hrefs).not.toContain(LOGIN_PATH);
    });
  });

  describe('role-based access control enforcement', () => {
    let page;

    beforeEach(async () => {
      page = await browser.newPage();
    });

    afterEach(async () => {
      await page.close();
    });

    it('denies access to profile page when no auth token is present', async () => {
      await interceptProfileApiWith(page, {
        statusCode: 401,
        body: { success: false, message: 'Authentication required.' },
      });

      await navigateTo(page, PROFILE_PATH);

      await waitForPathname(page, LOGIN_PATH);

      expect(page.url()).toContain(LOGIN_PATH);
    });

    it('allows access to profile page when valid auth token is present', async () => {
      await interceptProfileApiWith(page, {
        statusCode: 200,
        body: { user: MOCK_PROFILE },
      });

      await navigateTo(page, PROFILE_PATH);

      await page.waitForSelector('#name', { timeout: 10000 });

      expect(page.url()).toContain(PROFILE_PATH);
    });

    it('redirects to login after session invalidation when accessing profile', async () => {
      await interceptProfileApiWith(page, {
        statusCode: 401,
        body: { success: false, message: 'Session has expired. Please log in again.' },
      });

      await navigateTo(page, PROFILE_PATH);

      await waitForPathname(page, LOGIN_PATH);

      expect(page.url()).toContain(LOGIN_PATH);
    });
  });
});
