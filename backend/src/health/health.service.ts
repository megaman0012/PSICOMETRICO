import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  check() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'psicometrico-backend'
    };
  }
}