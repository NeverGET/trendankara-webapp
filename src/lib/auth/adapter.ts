/**
 * Custom MySQL adapter for NextAuth.js v5
 * SIMPLE implementation - just the essentials for database sessions
 */

import type { Adapter, AdapterUser, AdapterSession, AdapterAccount } from 'next-auth/adapters';
import { db } from '@/lib/db/client';
import { v4 as uuidv4 } from 'crypto';

/**
 * Generate a unique ID for sessions and accounts
 */
function generateId(): string {
  return uuidv4();
}

/**
 * Custom MySQL adapter for NextAuth.js
 * Implements the minimum required methods for database sessions
 */
export function MySQLAdapter(): Adapter {
  return {
    async createUser(user: Omit<AdapterUser, 'id'>) {
      const { email, emailVerified, name, image } = user;

      const result = await db.query(
        `INSERT INTO users (email, name, password, role, is_active)
         VALUES (?, ?, '', 'admin', TRUE)`,
        [email, name || email]
      );

      const insertId = (result.rows as any).insertId;

      return {
        id: insertId.toString(),
        email: email!,
        emailVerified,
        name,
        image
      };
    },

    async getUser(id: string) {
      const result = await db.query(
        `SELECT id, email, name, role, is_active
         FROM users
         WHERE id = ? AND deleted_at IS NULL`,
        [parseInt(id)]
      );

      const user = result.rows[0];
      if (!user) return null;

      return {
        id: user.id.toString(),
        email: user.email,
        emailVerified: null,
        name: user.name,
        image: null
      };
    },

    async getUserByEmail(email: string) {
      const result = await db.query(
        `SELECT id, email, name, role, is_active
         FROM users
         WHERE email = ? AND deleted_at IS NULL`,
        [email]
      );

      const user = result.rows[0];
      if (!user) return null;

      return {
        id: user.id.toString(),
        email: user.email,
        emailVerified: null,
        name: user.name,
        image: null
      };
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const result = await db.query(
        `SELECT u.id, u.email, u.name, u.role, u.is_active
         FROM users u
         INNER JOIN accounts a ON a.user_id = u.id
         WHERE a.provider_account_id = ? AND a.provider = ?
         AND u.deleted_at IS NULL`,
        [providerAccountId, provider]
      );

      const user = result.rows[0];
      if (!user) return null;

      return {
        id: user.id.toString(),
        email: user.email,
        emailVerified: null,
        name: user.name,
        image: null
      };
    },

    async updateUser(user: Partial<AdapterUser> & Pick<AdapterUser, 'id'>) {
      const { id, name, email, emailVerified, image } = user;

      const updates: string[] = [];
      const values: any[] = [];

      if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
      }

      if (email !== undefined) {
        updates.push('email = ?');
        values.push(email);
      }

      if (updates.length === 0) return null;

      values.push(parseInt(id));

      await db.query(
        `UPDATE users SET ${updates.join(', ')}, updated_at = NOW()
         WHERE id = ? AND deleted_at IS NULL`,
        values
      );

      return await this.getUser(id);
    },

    async deleteUser(userId: string) {
      // Soft delete the user
      await db.query(
        `UPDATE users SET deleted_at = NOW()
         WHERE id = ?`,
        [parseInt(userId)]
      );
    },

    async linkAccount(account: AdapterAccount) {
      await db.query(
        `INSERT INTO accounts (
          id, user_id, type, provider, provider_account_id,
          refresh_token, access_token, expires_at, token_type,
          scope, id_token, session_state
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          generateId(),
          parseInt(account.userId),
          account.type,
          account.provider,
          account.providerAccountId,
          account.refresh_token || null,
          account.access_token || null,
          account.expires_at || null,
          account.token_type || null,
          account.scope || null,
          account.id_token || null,
          account.session_state || null
        ]
      );
    },

    async unlinkAccount({ providerAccountId, provider }) {
      await db.query(
        `DELETE FROM accounts
         WHERE provider_account_id = ? AND provider = ?`,
        [providerAccountId, provider]
      );
    },

    async getAccount(providerAccountId: string, provider: string) {
      const result = await db.query(
        `SELECT * FROM accounts
         WHERE provider_account_id = ? AND provider = ?`,
        [providerAccountId, provider]
      );

      const account = result.rows[0];
      if (!account) return null;

      return {
        ...account,
        userId: account.user_id.toString(),
        expires_at: account.expires_at ? Number(account.expires_at) : null
      };
    },

    async createSession(session: {
      sessionToken: string;
      userId: string;
      expires: Date;
    }) {
      const sessionId = generateId();

      await db.query(
        `INSERT INTO sessions (id, user_id, session_token, expires)
         VALUES (?, ?, ?, ?)`,
        [
          sessionId,
          parseInt(session.userId),
          session.sessionToken,
          session.expires
        ]
      );

      return {
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires
      };
    },

    async getSessionAndUser(sessionToken: string) {
      const result = await db.query(
        `SELECT s.*, u.id as user_id, u.email, u.name, u.role, u.is_active
         FROM sessions s
         INNER JOIN users u ON s.user_id = u.id
         WHERE s.session_token = ?
         AND s.expires > NOW()
         AND u.deleted_at IS NULL`,
        [sessionToken]
      );

      const row = result.rows[0];
      if (!row) return null;

      return {
        session: {
          sessionToken: row.session_token,
          userId: row.user_id.toString(),
          expires: new Date(row.expires)
        },
        user: {
          id: row.user_id.toString(),
          email: row.email,
          emailVerified: null,
          name: row.name,
          image: null
        }
      };
    },

    async updateSession(session: {
      sessionToken: string;
      expires?: Date;
    }) {
      if (session.expires) {
        await db.query(
          `UPDATE sessions SET expires = ?, updated_at = NOW()
           WHERE session_token = ?`,
          [session.expires, session.sessionToken]
        );
      }

      const result = await db.query(
        `SELECT * FROM sessions WHERE session_token = ?`,
        [session.sessionToken]
      );

      const updatedSession = result.rows[0];
      if (!updatedSession) return null;

      return {
        sessionToken: updatedSession.session_token,
        userId: updatedSession.user_id.toString(),
        expires: new Date(updatedSession.expires)
      };
    },

    async deleteSession(sessionToken: string) {
      await db.query(
        `DELETE FROM sessions WHERE session_token = ?`,
        [sessionToken]
      );
    },

    async createVerificationToken(token: {
      identifier: string;
      expires: Date;
      token: string;
    }) {
      await db.query(
        `INSERT INTO verification_tokens (identifier, token, expires)
         VALUES (?, ?, ?)`,
        [token.identifier, token.token, token.expires]
      );

      return token;
    },

    async useVerificationToken(token: { identifier: string; token: string }) {
      const result = await db.query(
        `SELECT * FROM verification_tokens
         WHERE identifier = ? AND token = ?`,
        [token.identifier, token.token]
      );

      const verificationToken = result.rows[0];
      if (!verificationToken) return null;

      await db.query(
        `DELETE FROM verification_tokens
         WHERE identifier = ? AND token = ?`,
        [token.identifier, token.token]
      );

      return {
        identifier: verificationToken.identifier,
        token: verificationToken.token,
        expires: new Date(verificationToken.expires)
      };
    }
  };
}