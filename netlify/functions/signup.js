import { getDatabase } from '@netlify/database';
import { randomBytes, scryptSync } from 'node:crypto';

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return Response.json({ error: 'Email and password are required.' }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const db = getDatabase();
  const existing = await db.sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
  if (existing.length) {
    return Response.json({ error: 'An account with that email already exists.' }, { status: 409 });
  }

  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');

  await db.sql`
    INSERT INTO users (email, password_hash, password_salt)
    VALUES (${email.toLowerCase()}, ${hash}, ${salt})
  `;

  return Response.json({ ok: true, email: email.toLowerCase() });
};

export const config = { path: '/api/signup' };
