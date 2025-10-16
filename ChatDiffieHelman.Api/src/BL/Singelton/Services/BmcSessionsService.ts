import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export enum BmcSessionState {
  Created,
  InProgress,
  Completed,
  Failed,
}

export class BmcSession {
  constructor(userId?: string) {
    this.userId = userId || '';
    this.createdAt = new Date();
    this.state = BmcSessionState.Created;
    this.current = null;
  }
  userId: string;
  sid: string = randomUUID();
  createdAt: Date;
  state: BmcSessionState;
  // Protocol ephemeral values for the current round
  // r: challenge bit (0/1), a: commitment, e: response from client
  current: { a: string; r: number } | null;
}

@Injectable()
export class BmcSessionsService {
  private sessions = new Map<string, BmcSession>();

  createSession(userId: string): string {
    const session = new BmcSession(userId);
    this.sessions.set(session.sid, session);
    return session.sid;
  }

  getSession(sid: string): BmcSession | null {
    return this.sessions.get(sid) || null;
  }

  deleteSession(sid: string): void {
    this.sessions.delete(sid);
  }

  updateSession(sid: string, session: BmcSession): void {
    this.sessions.set(sid, session);
  }
}
