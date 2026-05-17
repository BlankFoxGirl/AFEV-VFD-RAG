const puppeteer = require('puppeteer');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const PROFILE_PATH = '/profile';
const API_PROFILE_PATH = '/api/profile';
const API_PROFILE_PASSWORD_PATH = '/api/profile/password';
const API_LOGIN_PATH = '/api/auth/login';
const LOGIN_PATH = '/login';

const MOCK_PROFILE = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+1234567890',
  avatarUrl: null,
};

const VALID_EMAIL = 'jane@example.com';
const VALID_PASSWORD = 'SecurePass1';

async function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

async function interceptProfileApiWith(page, { statusCode, body }) {
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes(API_PROFILE_PATH) && request.method() === 'GET') {
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

async function interceptProfileUpdateWith(page, { statusCode, body }) {
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const url = request.url();
    const isProfileGet =
      url.includes(API_PROFILE_PATH) && request.method() === 'GET';
    const isProfilePut =
      url.includes(API_PROFILE_PATH) && request.method() === 'PUT';

    if (isProfileGet) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: MOCK_PROFILE }),
      });
    } else if (isProfilePut) {
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

async function interceptPasswordUpdateWith(page, { statusCode, body }) {
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const url = request.url();
    const isProfileGet =
      url.includes(API_PROFILE_PATH) &&
      !url.includes('password') &&
      request.method() === 'GET';
    const isPasswordPut =
      url.includes(API_PROFILE_PASSWORD_PATH) && request.method() === 'PUT';

    if (isProfileGet) {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: MOCK_PROFILE }),
      });
    } else if (isPasswordPut) {
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

async function interceptLoginApiWith(page, { statusCode, body }) {
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (
      request.url().includes(API_LOGIN_PATH) &&
      request.method() === 'POST'
    ) {
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

async function navigateToProfilePage(page) {
  await page.goto(`${FRONTEND_URL}${PROFILE_PATH}`, {
    waitUntil: 'networkidle0',
  });
}

async function waitForFieldValue(page, selector, value) {
  await page.waitForSelector(selector);
  await page.waitForFunction(
    (sel, val) => document.querySelector(sel)?.value === val,
    {},
    selector,
    value
  );
}

async function getStatusText(page) {
  await page.waitForSelector('[role="status"]', { timeout: 5000 });
  return page.$eval('[role="status"]', (el) => el.textContent);
}

async function getAlertText(page) {
  await page.waitForSelector('[role="alert"]', { timeout: 5000 });
  return page.$eval('[role="alert"]', (el) => el.textContent);
}

describe('Profile Page E2E', () => {
  let browser;

  beforeAll(async () => {
    browser = await launchBrowser();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('profile data display', () => {
    let page;

    beforeEach(async () => {
      page = await browser.newPage();
      await interceptProfileApiWith(page, {
        statusCode: 200,
        body: { user: MOCK_PROFILE },
      });
      await navigateToProfilePage(page);
    });

    afterEach(async () => {
      await page.close();
    });

    it('pre-fills the name field with current user data', async () => {
      await waitForFieldValue(page, '#name', MOCK_PROFILE.name);
      const value = await page.$eval('#name', (el) => el.value);
      expect(value).toBe(MOCK_PROFILE.name);
    });

    it('pre-fills the email field with current user data', async () => {
      await waitForFieldValue(page, '#profileEmail', MOCK_PROFILE.email);
      const value = await page.$eval('#profileEmail', (el) => el.value);
      expect(value).toBe(MOCK_PROFILE.email);
    });

    it('pre-fills the phone field with current user data', async () => {
      await waitForFieldValue(page, '#phone', MOCK_PROFILE.phone);
      const value = await page.$eval('#phone', (el) => el.value);
      expect(value).toBe(MOCK_PROFILE.phone);
    });
  });

  describe('profile info update', () => {
    let page;

    beforeEach(async () => {
      page = await browser.newPage();
    });

    afterEach(async () => {
      await page.close();
    });

    it('shows success message after updating profile information', async () => {
      await interceptProfileUpdateWith(page, {
        statusCode: 200,
        body: { user: { ...MOCK_PROFILE, name: 'John Smith' } },
      });
      await navigateToProfilePage(page);
      await waitForFieldValue(page, '#name', MOCK_PROFILE.name);

      await page.click('#name', { clickCount: 3 });
      await page.type('#name', 'John Smith');
      await page.click('button[type="submit"]');

      const statusText = await getStatusText(page);
      expect(statusText).toMatch(/profile updated successfully/i);
    });

    it('shows error banner when profile update fails', async () => {
      await interceptProfileUpdateWith(page, {
        statusCode: 409,
        body: { message: 'Email is already in use.' },
      });
      await navigateToProfilePage(page);
      await waitForFieldValue(page, '#name', MOCK_PROFILE.name);

      await page.click('button[type="submit"]');

      const alertText = await getAlertText(page);
      expect(alertText).toMatch(/email is already in use/i);
    });
  });

  describe('password change', () => {
    let page;

    beforeEach(async () => {
      page = await browser.newPage();
    });

    afterEach(async () => {
      await page.close();
    });

    it('shows success message after password is updated', async () => {
      await interceptPasswordUpdateWith(page, {
        statusCode: 200,
        body: { success: true },
      });
      await navigateToProfilePage(page);
      await waitForFieldValue(page, '#name', MOCK_PROFILE.name);

      await page.type('#currentPassword', 'OldPass123');
      await page.type('#newPassword', 'NewPass456');
      await page.type('#confirmNewPassword', 'NewPass456');

      const updateButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button[type="submit"]'));
        return buttons.find((b) => /update password/i.test(b.textContent));
      });
      await updateButton.click();

      const statusText = await getStatusText(page);
      expect(statusText).toMatch(/password updated successfully/i);
    });

    it('shows error when new passwords do not match', async () => {
      await interceptPasswordUpdateWith(page, {
        statusCode: 200,
        body: { success: true },
      });
      await navigateToProfilePage(page);
      await waitForFieldValue(page, '#name', MOCK_PROFILE.name);

      await page.type('#currentPassword', 'OldPass123');
      await page.type('#newPassword', 'NewPass456');
      await page.type('#confirmNewPassword', 'DifferentPass');
      await page.click('#name');

      const alertText = await getAlertText(page);
      expect(alertText).toMatch(/passwords do not match/i);
    });
  });

  describe('profile update validation', () => {
    let page;

    beforeEach(async () => {
      page = await browser.newPage();
      await interceptProfileApiWith(page, {
        statusCode: 200,
        body: { user: MOCK_PROFILE },
      });
      await navigateToProfilePage(page);
      await waitForFieldValue(page, '#name', MOCK_PROFILE.name);
    });

    afterEach(async () => {
      await page.close();
    });

    it('shows validation error when email format is invalid before submission', async () => {
      await page.click('#profileEmail', { clickCount: 3 });
      await page.type('#profileEmail', 'not-an-email');
      await page.click('#name');

      const alertText = await getAlertText(page);
      expect(alertText).toMatch(/valid email address/i);
    });

    it('shows validation error when new password lacks an uppercase letter', async () => {
      await page.type('#newPassword', 'nouppercase1');
      await page.click('#name');

      const alertText = await getAlertText(page);
      expect(alertText).toMatch(/uppercase letter/i);
    });

    it('shows validation error when new password lacks a number', async () => {
      await page.type('#newPassword', 'NoNumberHere');
      await page.click('#name');

      const alertText = await getAlertText(page);
      expect(alertText).toMatch(/at least one number/i);
    });

    it('does not call the API when client-side email validation fails', async () => {
      let profileUpdateCalled = false;
      page.on('request', (request) => {
        if (request.url().includes(API_PROFILE_PATH) && request.method() === 'PUT') {
          profileUpdateCalled = true;
        }
      });

      await page.click('#profileEmail', { clickCount: 3 });
      await page.type('#profileEmail', 'bad-email');
      await page.click('button[type="submit"]');

      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(profileUpdateCalled).toBe(false);
    });
  });

  describe('full user journey', () => {
    let page;

    beforeEach(async () => {
      page = await browser.newPage();
    });

    afterEach(async () => {
      await page.close();
    });

    it('allows login then profile access and detail modification with success confirmation', async () => {
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const url = request.url();
        if (url.includes(API_LOGIN_PATH) && request.method() === 'POST') {
          request.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, user: { email: VALID_EMAIL } }),
          });
        } else if (url.includes(API_PROFILE_PATH) && request.method() === 'GET') {
          request.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ user: MOCK_PROFILE }),
          });
        } else if (url.includes(API_PROFILE_PATH) && request.method() === 'PUT') {
          request.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ user: { ...MOCK_PROFILE, name: 'John Smith' } }),
          });
        } else {
          request.continue();
        }
      });

      await page.goto(`${FRONTEND_URL}${LOGIN_PATH}`, {
        waitUntil: 'networkidle0',
      });
      await page.type('#email', VALID_EMAIL);
      await page.type('#password', VALID_PASSWORD);

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
        page.click('button[type="submit"]'),
      ]);

      await page.goto(`${FRONTEND_URL}${PROFILE_PATH}`, {
        waitUntil: 'networkidle0',
      });

      await waitForFieldValue(page, '#name', MOCK_PROFILE.name);

      await page.click('#name', { clickCount: 3 });
      await page.type('#name', 'John Smith');
      await page.click('button[type="submit"]');

      const statusText = await getStatusText(page);
      expect(statusText).toMatch(/profile updated successfully/i);
    });
  });
});
