import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppService } from './app.service.js';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Liveness/readiness probe.
   *
   * Reported unhealthy when the database is unreachable, so a platform will not
   * route traffic to an instance that cannot serve requests. Excluded from the
   * `/api` prefix and from the HTTPS redirect.
   */
  @Get('health')
  @ApiOperation({ summary: 'Health probe, including database connectivity.' })
  async health(): Promise<{
    status: 'ok' | 'degraded';
    database: 'up' | 'down';
    uptime: number;
  }> {
    let database: 'up' | 'down' = 'down';
    try {
      await this.dataSource.query('SELECT 1');
      database = 'up';
    } catch {
      database = 'down';
    }

    return {
      status: database === 'up' ? 'ok' : 'degraded',
      database,
      uptime: Math.round(process.uptime()),
    };
  }
}
