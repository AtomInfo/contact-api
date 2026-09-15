jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

import fs from 'fs';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(() => {
    controller = new HealthController();
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.npm_package_version;
  });

  it('should return health status and uptime', () => {
    const result = controller.health();

    expect(result).toMatchObject({ status: 'ok' });
    expect(typeof result.uptime).toBe('number');
    expect(result.uptime).toBeGreaterThanOrEqual(0);
  });

  it('should return a version string', () => {
    const result = controller.version();

    expect(result).toHaveProperty('version');
    expect(typeof result.version).toBe('string');
  });

  it('should fall back to the environment version when package.json cannot be read', () => {
    process.env.npm_package_version = '9.9.9';
    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('missing package file');
    });

    const result = controller.version();

    expect(result).toEqual({ version: '9.9.9' });
  });
});
