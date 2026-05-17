jest.mock('mongoose');
const mongoose = require('mongoose');
const { connectToDatabase, disconnectFromDatabase } = require('../../src/db');

describe('database initialisation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('connects to MongoDB using the provided URI', async () => {
    mongoose.connect.mockResolvedValue(undefined);
    await connectToDatabase('mongodb://localhost:27017/testdb');
    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/testdb');
  });

  it('resolves successfully when the connection is established', async () => {
    mongoose.connect.mockResolvedValue(undefined);
    await expect(connectToDatabase('mongodb://localhost:27017/testdb')).resolves.not.toThrow();
  });

  it('propagates connection errors', async () => {
    mongoose.connect.mockRejectedValue(new Error('connection refused'));
    await expect(connectToDatabase('mongodb://invalid-host/testdb')).rejects.toThrow('connection refused');
  });

  it('disconnects from MongoDB', async () => {
    mongoose.disconnect.mockResolvedValue(undefined);
    await disconnectFromDatabase();
    expect(mongoose.disconnect).toHaveBeenCalled();
  });

  it('resolves successfully when disconnecting', async () => {
    mongoose.disconnect.mockResolvedValue(undefined);
    await expect(disconnectFromDatabase()).resolves.not.toThrow();
  });
});
