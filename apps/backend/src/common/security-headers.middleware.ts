import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction } from 'express';

interface SecurityHeadersResponse {
  removeHeader(name: string): void;
  setHeader(name: string, value: string): void;
}

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(_req: unknown, res: SecurityHeadersResponse, next: NextFunction): void {
    res.removeHeader('X-Powered-By');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  }
}
