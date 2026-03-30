import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { randomUUID } from 'crypto';
import { User } from 'src/Data/Entities/User';
import { Repository } from 'typeorm';

class UniAuthUpstreamHttpError extends Error {
  constructor(
    readonly status: number,
    readonly responseBody?: string,
  ) {
    super(`UniAuth upstream responded with status ${status}`);
  }
}

interface UniAuthToken1Response {
  token1: string;
  expiresInSeconds: number;
}

interface UniAuthSsoUser {
  userId: string;
  clientId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
}

interface UniAuthIntrospectOkResponse {
  status: 'OK';
  user: UniAuthSsoUser;
}

interface UniAuthIntrospectErrorResponse {
  status: 'ERROR';
  reason?: string;
}

type UniAuthIntrospectResponse =
  | UniAuthIntrospectOkResponse
  | UniAuthIntrospectErrorResponse;

export type UniAuthCallbackResult =
  | { status: 'OK'; accessToken: string }
  | { status: 'ERROR'; reason: string };

@Injectable()
export class UniAuthSsoService {
  private readonly logger = new Logger(UniAuthSsoService.name);
  private readonly defaultTimeoutMs = 7000;

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async start(): Promise<{ redirectUrl: string }> {
    const applicationId = this.requiredEnv(
      'UNI_AUTH_APPLICATION_ID',
      '5107f420-bbbd-430b-aee7-6329021b058d',
    );
    const ownerAccessToken = this.requiredEnv('UNI_AUTH_OWNER_ACCESS_TOKEN');
    const token1Endpoint = `${this.uniAuthApiBase}/oauth2/sso/issue-token-1`;

    try {
      const token1Response = await this.fetchJson<UniAuthToken1Response>(
        token1Endpoint,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${ownerAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: '{}',
        },
      );

      if (!token1Response?.token1) {
        throw new Error('UniAuth token-1 response does not contain token1');
      }

      return {
        redirectUrl: `${this.uniAuthWebBase}/oauth2/external-redirect/${encodeURIComponent(token1Response.token1)}`,
      };
    } catch (error) {
      if (error instanceof UniAuthUpstreamHttpError) {
        this.logger.warn(
          `Failed to start UniAuth SSO flow (status=${error.status})`,
        );
      } else {
        this.logger.warn('Failed to start UniAuth SSO flow');
      }

      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      if (
        error instanceof UniAuthUpstreamHttpError &&
        (error.status === 401 || error.status === 403)
      ) {
        throw new ServiceUnavailableException(
          'UniAuth отклонил технический токен владельца приложения. Проверьте UNI_AUTH_OWNER_ACCESS_TOKEN.',
        );
      }

      if (error instanceof UniAuthUpstreamHttpError && error.status === 404) {
        throw new ServiceUnavailableException(
          'UniAuth не нашел приложение. Проверьте UNI_AUTH_APPLICATION_ID и UNI_AUTH_API_BASE.',
        );
      }

      throw new ServiceUnavailableException(
        'Не удалось начать вход через UniAuth. Повторите попытку позже.',
      );
    }
  }

  async handleCallback(token3: string): Promise<UniAuthCallbackResult> {
    if (!token3?.trim()) {
      return { status: 'ERROR', reason: 'Не получен token3 от UniAuth.' };
    }

    try {
      const introspectResponse =
        await this.fetchJson<UniAuthIntrospectResponse>(
          `${this.uniAuthApiBase}/oauth2/sso/introspect-token-3`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token3 }),
          },
        );

      if (introspectResponse.status === 'ERROR') {
        return {
          status: 'ERROR',
          reason:
            introspectResponse.reason ||
            'Token 3 недействителен или уже истёк. Повторите вход.',
        };
      }

      const localUser = await this.findOrCreateLocalUser(
        introspectResponse.user,
      );
      const payload = { email: localUser.email, sub: localUser.id };

      return {
        status: 'OK',
        accessToken: this.jwtService.sign(payload),
      };
    } catch (error) {
      this.logger.warn(
        'UniAuth callback failed due to upstream or network issue',
      );

      return {
        status: 'ERROR',
        reason:
          'Не удалось связаться с UniAuth. Попробуйте повторить вход через несколько секунд.',
      };
    }
  }

  private async findOrCreateLocalUser(ssoUser: UniAuthSsoUser): Promise<User> {
    const normalizedEmail = (ssoUser.email || '').trim().toLowerCase();
    const normalizedUserId = (ssoUser.userId || '').trim();

    let existingUser: User | null = null;

    if (normalizedUserId) {
      existingUser = await this.userRepository.findOne({
        where: { uniauth_user_id: normalizedUserId },
      });
    }

    if (!existingUser && normalizedEmail) {
      existingUser = await this.userRepository.findOne({
        where: { email: normalizedEmail },
      });
    }

    if (existingUser) {
      if (
        existingUser.uniauth_user_id &&
        normalizedUserId &&
        existingUser.uniauth_user_id !== normalizedUserId
      ) {
        throw new Error('UniAuth user mismatch for existing local account');
      }

      let changed = false;

      if (!existingUser.uniauth_user_id && normalizedUserId) {
        existingUser.uniauth_user_id = normalizedUserId;
        changed = true;
      }

      if (!existingUser.name?.trim()) {
        existingUser.name = this.buildDisplayName(ssoUser, normalizedEmail);
        changed = true;
      }

      if (changed) {
        return this.userRepository.save(existingUser);
      }

      return existingUser;
    }

    const safeIdPart = (normalizedUserId || randomUUID())
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .slice(0, 80);
    const generatedEmail =
      normalizedEmail || `uniauth-${safeIdPart}@local.invalid`;

    const newUser = this.userRepository.create({
      name: this.buildDisplayName(ssoUser, generatedEmail),
      email: generatedEmail,
      password: randomUUID(),
      uniauth_user_id: normalizedUserId || null,
    });

    return this.userRepository.save(newUser);
  }

  private buildDisplayName(ssoUser: UniAuthSsoUser, email: string): string {
    const firstName = (ssoUser.firstName || '').trim();
    const lastName = (ssoUser.lastName || '').trim();
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

    if (fullName) {
      return fullName;
    }

    const emailName = email.split('@')[0]?.trim();
    if (emailName) {
      return emailName;
    }

    return 'UniAuth User';
  }

  private requiredEnv(name: string, fallback?: string): string {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }

    if (fallback?.trim()) {
      this.logger.warn(
        `${name} is not set. Falling back to default value configured in service.`,
      );
      return fallback.trim();
    }

    throw new InternalServerErrorException(
      `${name} is not configured for UniAuth integration. Set it in ChatDiffieHelman.Api/.env (see .env.example).`,
    );
  }

  private async fetchJson<T>(url: string, init: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.httpTimeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      const textPayload = await response.text();
      const parsedPayload = textPayload ? JSON.parse(textPayload) : null;

      if (!response.ok) {
        throw new UniAuthUpstreamHttpError(response.status, textPayload);
      }

      return parsedPayload as T;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(
          `Upstream request timed out after ${this.httpTimeoutMs}ms`,
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private get uniAuthApiBase(): string {
    const raw = process.env.UNI_AUTH_API_BASE || 'http://localhost:3001/api/v1';
    return raw.replace(/\/+$/, '');
  }

  private get uniAuthWebBase(): string {
    const raw = process.env.UNI_AUTH_WEB_BASE || 'http://localhost:4200';
    return raw.replace(/\/+$/, '');
  }

  private get httpTimeoutMs(): number {
    const rawValue = Number(process.env.UNI_AUTH_HTTP_TIMEOUT_MS);
    if (Number.isFinite(rawValue) && rawValue >= 1000 && rawValue <= 30000) {
      return rawValue;
    }

    return this.defaultTimeoutMs;
  }
}
