const puppeteer = require('puppeteer');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const LOGIN_PATH = '/login';
const API_LOGIN_PATH = '/api/auth/login';
const API_SESSION_STATUS_PATH = '/api/session/status';
const API_SESSION_RENEW_PATH = '/api/session/renew';

const VALID_EMAIL = 'user@example.com';
const VALID_PASSWORD = 'SecurePass1';
const MOCK_SESSION_ID = 'mock-session-id-abc123';
const MOCK_TOKEN = 'mock.jwt.token';

async function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

async function navigateToLoginPage(page) {
  await page.goto(`${FRONTEND_URL}${LOGIN_PATH}`, { waitUntil: 'networkidle0' });
}

async function fillLoginForm(page, { email, password }) {
  await page.type('#email', email);
  await page.type('#password', password);
}

async function submitForm(page) {
  await page.click('button[type="submit"]');
}

function buildActiveSessionResponse() {
  return {
    success: true,
    user: { email: VALID_EMAIL },
    token: MOCK_TOKEN,
    session: {
      sessionId: MOCK_SESSION_ID,
      userId: 'user-id-1',
      email: VALID_EMAIL,
      expiresAt: Date.now() + 30 * 60 * 1000,
      lastActivityAt: Date.now(),
    },
  };
}

async function interceptApiWith(page, pathPattern, method, responseConfig) {
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request.url().includes(pathPattern) && request.method() === method) {
      request.respond({
        status: responseConfig.statusCode,
        contentType: 'application/json',
        body: JSON.stringify(responseConfig.body),
      });
    } else {
      request.continue();
    }
  });
}

async function interceptMultipleApis(page, interceptors) {
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const matched = interceptors.find(
      (i) => request.url().includes(i.path) && request.method() === i.method
    );
    if (matched) {
      request.respond({
        status: matched.statusCode,
        contentType: 'application/json',
        body: JSON.stringify(matched.body),
      });
    } else {
      request.continue();
    }
  });
}

async function getFirstAlertText(page) {
  await page.waitForSelector('[role="alert"]', { timeout: 5000 });
  return page.$eval('[role="alert"]', (el) => el.textContent);
}

describe('Session Management E2E', () => {
  let browser;

  beforeAll(async () => {
    browser = await launchBrowser();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('session creation on login', () => {
    let page;

    beforeEach(async () => {
      page = await browser.newPage();
    });

    afterEach(async () => {
      await page.close();
    });

    it('redirects to dashboard after successful login (session created)', async () => {
      await interceptApiWith(page, API_LOGIN_PATH, 'POST', {
        statusCode: 200,
        body: buildActiveSessionResponse(),
      });
      await navigateToLoginPage(page);
      await fillLoginForm(page, { email: VALID_EMAIL, password: VALID_PASSWORD });

      const [navigation] = await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
        submitForm(page),
      ]);

      expect(page.url()).toContain('/dashboard');
    });
  });

  describe('expired session handling', () => {
    let page;

    beforeEach(async () => {
      page = await browser.newPage();
    });

    afterEach(async () => {
      await page.close();
    });

    it('displays an error message when the login API returns a session-expired response', async () => {
      await interceptApiWith(page, API_LOGIN_PATH, 'POST', {
        statusCode: 401,
        body: { success: false, message: 'Session has expired.' },
      });
      await navigateToLoginPage(page);
      await fillLoginForm(page, { email: VALID_EMAIL, password: VALID_PASSWORD });
      await submitForm(page);

      const alertText = await getFirstAlertText(page);
      expect(alertText).toMatch(/expired|invalid email or password/i);
    });

    it('displays an error when credentials are invalid after session expiry', async () => {
      await interceptApiWith(page, API_LOGIN_PATH, 'POST', {
        statusCode: 401,
        body: { success: false, message: 'Invalid email or password.' },
      });
      await navigateToLoginPage(page);
      await fillLoginForm(page, { email: VALID_EMAIL, password: VALID_PASSWORD });
      await submitForm(page);

      const alertText = await getFirstAlertText(page);
      expect(alertText).toMatch(/invalid email or password/i);
    });
  });

  describe('session renewal', () => {
    let page;

    beforeEach(async () => {
      page = await browser.newPage();
    });

    afterEach(async () => {
      await page.close();
    });

    it('remains on dashboard after login when session renewal API succeeds', async () => {
      await interceptMultipleApis(page, [
        {
          path: API_LOGIN_PATH,
          method: 'POST',
          statusCode: 200,
          body: buildActiveSessionResponse(),
        },
        {
          path: API_SESSION_RENEW_PATH,
          method: 'POST',
          statusCode: 200,
          body: {
            success: true,
            token: 'renewed.jwt.token',
            session: {
              sessionId: MOCK_SESSION_ID,
              email: VALID_EMAIL,
              expiresAt: Date.now() + 30 * 60 * 1000,
              lastActivityAt: Date.now(),
            },
          },
        },
      ]);

      await navigateToLoginPage(page);
      await fillLoginForm(page, { email: VALID_EMAIL, password: VALID_PASSWORD });

      const [navigation] = await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
        submitForm(page),
      ]);

      expect(page.url()).toContain('/dashboard');
    });
  });
});
