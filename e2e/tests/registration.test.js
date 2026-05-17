const puppeteer = require('puppeteer');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const REGISTER_PATH = '/register';
const API_REGISTER_PATH = '/api/auth/register';

const VALID_EMAIL = `e2e-${Date.now()}@example.com`;
const VALID_PASSWORD = 'SecurePass1';
const INVALID_EMAIL = 'not-an-email';
const SHORT_PASSWORD = 'short';
const DUPLICATE_EMAIL = 'duplicate@example.com';

async function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

async function navigateToRegisterPage(page) {
  await page.goto(`${FRONTEND_URL}${REGISTER_PATH}`, { waitUntil: 'networkidle0' });
}

async function fillEmailField(page, email) {
  await page.type('#email', email);
}

async function fillPasswordField(page, password) {
  await page.type('#password', password);
}

async function fillConfirmPasswordField(page, confirmPassword) {
  await page.type('#confirmPassword', confirmPassword);
}

async function fillRegistrationForm(page, { email, password, confirmPassword }) {
  await fillEmailField(page, email);
  await fillPasswordField(page, password);
  await fillConfirmPasswordField(page, confirmPassword ?? password);
}

async function submitForm(page) {
  await page.click('button[type="submit"]');
}

async function interceptRegisterApiWith(page, { statusCode, body }) {
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request.url().includes(API_REGISTER_PATH) && request.method() === 'POST') {
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

async function getAllAlertTexts(page) {
  await page.waitForSelector('[role="alert"]', { timeout: 5000 });
  return page.$$eval('[role="alert"]', (els) => els.map((el) => el.textContent));
}

describe('Registration E2E', () => {
  let browser;

  beforeAll(async () => {
    browser = await launchBrowser();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('successful registration', () => {
    let page;

    beforeEach(async () => {
      page = await browser.newPage();
      await interceptRegisterApiWith(page, {
        statusCode: 201,
        body: { success: true, user: { email: VALID_EMAIL } },
      });
      await navigateToRegisterPage(page);
    });

    afterEach(async () => {
      await page.close();
    });

    it('redirects to login page after valid form submission', async () => {
      await fillRegistrationForm(page, { email: VALID_EMAIL, password: VALID_PASSWORD });
      const [navigation] = await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
        submitForm(page),
      ]);
      expect(page.url()).toContain('/login');
    });
  });

  describe('form validation errors', () => {
    let page;

    beforeEach(async () => {
      page = await browser.newPage();
      await navigateToRegisterPage(page);
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

    it('displays error when confirm password does not match password', async () => {
      await fillRegistrationForm(page, {
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
        confirmPassword: 'completely-different',
      });
      await submitForm(page);
      const alertTexts = await getAllAlertTexts(page);
      expect(alertTexts.some((text) => /do not match/i.test(text))).toBe(true);
    });

    it('displays required error when form is submitted empty', async () => {
      await submitForm(page);
      const alertText = await getFirstAlertText(page);
      expect(alertText).toMatch(/required/i);
    });
  });

  describe('server-side registration errors', () => {
    let page;

    beforeEach(async () => {
      page = await browser.newPage();
    });

    afterEach(async () => {
      await page.close();
    });

    it('displays error message when email is already registered', async () => {
      await interceptRegisterApiWith(page, {
        statusCode: 409,
        body: { success: false, errors: { email: 'Email is already registered' } },
      });
      await navigateToRegisterPage(page);
      await fillRegistrationForm(page, { email: DUPLICATE_EMAIL, password: VALID_PASSWORD });
      await submitForm(page);
      const alertText = await getFirstAlertText(page);
      expect(alertText).toMatch(/already registered/i);
    });
  });
});
