const puppeteer = require('puppeteer');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const LOGIN_PATH = '/login';
const API_LOGIN_PATH = '/api/auth/login';

const VALID_EMAIL = 'user@example.com';
const VALID_PASSWORD = 'SecurePass1';
const INVALID_EMAIL = 'not-an-email';
const SHORT_PASSWORD = 'short';

async function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

async function navigateToLoginPage(page) {
  await page.goto(`${FRONTEND_URL}${LOGIN_PATH}`, { waitUntil: 'networkidle0' });
}

async function fillEmailField(page, email) {
  await page.type('#email', email);
}

async function fillPasswordField(page, password) {
  await page.type('#password', password);
}

async function fillLoginForm(page, { email, password }) {
  await fillEmailField(page, email);
  await fillPasswordField(page, password);
}

async function submitForm(page) {
  await page.click('button[type="submit"]');
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

async function getFirstAlertText(page) {
  await page.waitForSelector('[role="alert"]', { timeout: 5000 });
  return page.$eval('[role="alert"]', (el) => el.textContent);
}

describe('Login E2E', () => {
  let browser;

  beforeAll(async () => {
    browser = await launchBrowser();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('successful login', () => {
    let page;

    beforeEach(async () => {
      page = await browser.newPage();
      await interceptLoginApiWith(page, {
        statusCode: 200,
        body: { success: true, user: { email: VALID_EMAIL } },
      });
      await navigateToLoginPage(page);
    });

    afterEach(async () => {
      await page.close();
    });

    it('redirects to dashboard after valid form submission', async () => {
      await fillLoginForm(page, { email: VALID_EMAIL, password: VALID_PASSWORD });
      const [navigation] = await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
        submitForm(page),
      ]);
      expect(page.url()).toContain('/dashboard');
    });
  });

  describe('form validation errors', () => {
    let page;

    beforeEach(async () => {
      page = await browser.newPage();
      await navigateToLoginPage(page);
    });

    afterEach(async () => {
      await page.close();
    });

    it('displays error when email format is invalid', async () => {
      await fillEmailField(page, INVALID_EMAIL);
      await page.click('#password');
      const alertText = await getFirstAlertText(page);
      expect(alertText).toMatch(/valid email/i);
    });

    it('displays error when password is shorter than 8 characters', async () => {
      await fillEmailField(page, VALID_EMAIL);
      await fillPasswordField(page, SHORT_PASSWORD);
      await submitForm(page);
      const alertText = await getFirstAlertText(page);
      expect(alertText).toMatch(/8 characters/i);
    });

    it('displays required error when form is submitted empty', async () => {
      await submitForm(page);
      const alertText = await getFirstAlertText(page);
      expect(alertText).toMatch(/required/i);
    });
  });

  describe('server-side login errors', () => {
    let page;

    beforeEach(async () => {
      page = await browser.newPage();
    });

    afterEach(async () => {
      await page.close();
    });

    it('displays error message when credentials are invalid', async () => {
      await interceptLoginApiWith(page, {
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
});
