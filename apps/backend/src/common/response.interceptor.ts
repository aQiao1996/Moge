import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import type { ApiResponse } from '@moge/types';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiResponse> {
    return next.handle().pipe(map((data: unknown) => ({ code: 200, data, message: 'success' })));
  }
}
