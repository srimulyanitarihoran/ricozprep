import { getDatabase } from '@netlify/database';
import { scryptSync, timingSafeEqual } from 'node:crypto';

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return Response.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const db = getDatabase();
  const rows = await db.sql`SELECT * FROM users WHERE email = ${email.toLowerCase()}`;
  const user = rows[0];
  if (!user) {
    return Response.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const hash = scryptSync(password, user.password_salt, 64);
  const stored = Buffer.from(user.password_hash, 'hex');
  const ok = hash.length === stored.length && timingSafeEqual(hash, stored);
  if (!ok) {
    return Response.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  return Response.json({ ok: true, email: user.email });
};

export const config = { path: '/api/login' };
