const { validateProfileUpdateMiddleware } = require('../../src/middleware/validateProfileUpdate');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('validateProfileUpdateMiddleware', () => {
  it('calls next when all fields are valid', () => {
    const req = { body: { name: 'Jane Doe', email: 'jane@example.com', phone: '+1234567890' } };
    const res = mockRes();
    const next = jest.fn();

    validateProfileUpdateMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('calls next when only name and email are provided', () => {
    const req = { body: { name: 'Jane Doe', email: 'jane@example.com' } };
    const res = mockRes();
    const next = jest.fn();

    validateProfileUpdateMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('calls next when no fields are provided (all optional)', () => {
    const req = { body: {} };
    const res = mockRes();
    const next = jest.fn();

    validateProfileUpdateMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns 400 when email format is invalid', () => {
    const req = { body: { email: 'not-an-email' } };
    const res = mockRes();
    const next = jest.fn();

    validateProfileUpdateMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, errors: expect.objectContaining({ email: expect.any(String) }) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 when name is empty', () => {
    const req = { body: { name: '' } };
    const res = mockRes();
    const next = jest.fn();

    validateProfileUpdateMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, errors: expect.objectContaining({ name: expect.any(String) }) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 when phone number format is invalid', () => {
    const req = { body: { phone: 'abc' } };
    const res = mockRes();
    const next = jest.fn();

    validateProfileUpdateMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, errors: expect.objectContaining({ phone: expect.any(String) }) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when phone is an empty string (phone is optional)', () => {
    const req = { body: { phone: '' } };
    const res = mockRes();
    const next = jest.fn();

    validateProfileUpdateMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
