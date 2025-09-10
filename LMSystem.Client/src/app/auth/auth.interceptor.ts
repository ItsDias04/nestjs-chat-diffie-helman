import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, throwError } from 'rxjs';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  
  const token = authService.token?.access_token;
  if (!token) {
    return next(req);
  }

  
  return next(addToken(req, token)).pipe(
    catchError((err) => {
      console.error('Error in authTokenInterceptor:', err);
      return throwError(() => new Error('HTTP request failed'));
    })
  );
};


const addToken = (req: HttpRequest<any>, token: string) => {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
};
