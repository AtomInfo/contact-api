import { Controller, Get } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Controller('api/v1')
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', uptime: process.uptime() };
  }

  @Get('version')
  version() {
    const pkgPath = path.resolve(__dirname, '../../package.json');
    let version = process.env.npm_package_version ?? '0.0.0';
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg?.version) version = pkg.version;
    } catch {
      // ignore
    }
    return { version };
  }
}
