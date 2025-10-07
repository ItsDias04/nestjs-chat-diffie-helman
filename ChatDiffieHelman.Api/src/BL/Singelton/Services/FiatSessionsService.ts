import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export enum FiatSessionState {
  Created,
  InProgress,
  Completed,
  Failed,
}

export class FiatSession {
  constructor(userId?: string) {
    this.userId = userId || '';
    this.createdAt = new Date();
    this.state = FiatSessionState.Created;
    this.current = null;
  }
  userId: string;
  sid: string = randomUUID();
  createdAt: Date;
  state: FiatSessionState;
  round_ok: number = 0;
  round_total: number = 0;
  current: { x: string; e: string } | null = null;
}

@Injectable()
export class FiatSessionsService {
  private sessions = new Map<string, FiatSession>();
  createSession(userId: string): string {
    const session = new FiatSession(userId);
    this.sessions.set(session.sid, session);
    return session.sid;
  }
  getSession(sid: string): FiatSession | null {
    return this.sessions.get(sid) || null;
  }
  deleteSession(sid: string): void {
    this.sessions.delete(sid);
  }
  updateSession(sid: string, session: FiatSession): void {
    this.sessions.set(sid, session);
  }
}
