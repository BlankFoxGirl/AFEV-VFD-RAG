const { validatePasswordUpdateMiddleware } = require('../../src/middleware/validatePasswordUpdate');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('validatePasswordUpdateMiddleware', () => {
  it('calls next when currentPassword and a strong newPassword are provided', () => {
    const req = { body: { currentPassword: 'OldPass1', newPassword: 'NewPass1' } };
    const res = mockRes();
    const next = jest.fn();

    validatePasswordUpdateMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 400 when currentPassword is missing', () => {
    const req = { body: { newPassword: 'NewPass1' } };
    const res = mockRes();
    const next = jest.fn();

    validatePasswordUpdateMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        errors: expect.objectContaining({ currentPassword: expect.any(String) }),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 when newPassword is too short', () => {
    const req = { body: { currentPassword: 'OldPass1', newPassword: 'short' } };
    const res = mockRes();
    const next = jest.fn();

    validatePasswordUpdateMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        errors: expect.objectContaining({ newPassword: expect.any(String) }),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 when newPassword has no uppercase letter', () => {
    const req = { body: { currentPassword: 'OldPass1', newPassword: 'nouppercase1' } };
    const res = mockRes();
    const next = jest.fn();

    validatePasswordUpdateMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        errors: expect.objectContaining({ newPassword: expect.stringMatching(/uppercase/i) }),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 when newPassword has no number', () => {
    const req = { body: { currentPassword: 'OldPass1', newPassword: 'NoNumberHere' } };
    const res = mockRes();
    const next = jest.fn();

    validatePasswordUpdateMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        errors: expect.objectContaining({ newPassword: expect.stringMatching(/number/i) }),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 when newPassword is undefined', () => {
    const req = { body: { currentPassword: 'OldPass1' } };
    const res = mockRes();
    const next = jest.fn();

    validatePasswordUpdateMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});
