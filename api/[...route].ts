import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { auth } from '../src/auth';
import { db } from '../src/db';
import * as schema from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { Context } from 'hono';

type Variables = {
  user: any;
};

const app = new Hono<{ Variables: Variables }>();

// DEBUG: Verify that Vercel is indeed stripping /api
app.use('*', async (c, next) => {
  console.log(`[Hono Debug] Final Path: ${c.req.path}`);
  await next();
});

app.get('/hello', (c) => {
  return c.json({ message: 'Hello from Kinetic Backend!' });
});

// Better Auth matches /auth/* after Vercel strips /api
app.on(['POST', 'GET'], '/auth/*', (c) => {
  return auth.handler(c.req.raw);
});

// Future DB API routes go here

// Middleware to protect routes
const protectedRoute = async (c: Context<{ Variables: Variables }>, next: any) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  c.set('user', session.user);
  await next();
};

app.post('/sync/push', protectedRoute, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const payload = body.payload; // Record<string, string | null>

  try {
    for (const [key, value] of Object.entries(payload)) {
      if (key === 'editor_docs' && value) {
        const docs = JSON.parse(value as string);
        for (const doc of docs) {
          await db.insert(schema.markdownDocs).values({
            id: doc.id,
            userId: user.id,
            name: doc.name,
            content: doc.content,
            updatedAt: new Date()
          }).onConflictDoUpdate({
            target: schema.markdownDocs.id,
            set: { name: doc.name, content: doc.content, updatedAt: new Date() }
          });
        }
      }
      else if (key === 'saved_pages' && value) {
        const pages = JSON.parse(value as string);
        for (const page of pages) {
          await db.insert(schema.pages).values({
            id: page.id,
            userId: user.id,
            name: page.name,
            baseUrl: page.baseUrl,
            updatedAt: new Date()
          }).onConflictDoUpdate({
            target: schema.pages.id,
            set: { name: page.name, baseUrl: page.baseUrl, updatedAt: new Date() }
          });
        }
      }
      else if (key === 'json_formatter_input' && value) {
        await db.insert(schema.jsonFormatterState).values({
          id: user.id + '_json', // singleton per user
          userId: user.id,
          content: value as string,
          updatedAt: new Date()
        }).onConflictDoUpdate({
          target: schema.jsonFormatterState.id,
          set: { content: value as string, updatedAt: new Date() }
        });
      }
    }
    return c.json({ success: true });
  } catch (err) {
    console.error('Push error:', err);
    return c.json({ error: 'Sync failed' }, 500);
  }
});

app.get('/sync/pull', protectedRoute, async (c) => {
  const user = c.get('user');
  try {
    const docs = await db.select().from(schema.markdownDocs).where(eq(schema.markdownDocs.userId, user.id));
    const repos = await db.select().from(schema.pages).where(eq(schema.pages.userId, user.id));
    const jsonFmt = await db.select().from(schema.jsonFormatterState).where(eq(schema.jsonFormatterState.userId, user.id)).limit(1);

    const payload: Record<string, string> = {};
    if (docs.length > 0) payload['editor_docs'] = JSON.stringify(docs);
    if (repos.length > 0) payload['saved_pages'] = JSON.stringify(repos);
    if (jsonFmt.length > 0) payload['json_formatter_input'] = jsonFmt[0].content;

    return c.json({ payload });
  } catch (err) {
    return c.json({ error: 'Pull failed' }, 500);
  }
});

app.get('/sync/export', protectedRoute, async (c) => {
  const user = c.get('user');
  try {
    const docs = await db.select().from(schema.markdownDocs).where(eq(schema.markdownDocs.userId, user.id));
    const repos = await db.select().from(schema.pages).where(eq(schema.pages.userId, user.id));
    const jsonFmt = await db.select().from(schema.jsonFormatterState).where(eq(schema.jsonFormatterState.userId, user.id)).limit(1);
    
    const exportManifest = {
      version: 1,
      timestamp: new Date().toISOString(),
      user: { id: user.id, email: user.email },
      data: {
        editor_docs: docs,
        saved_pages: repos,
        json_formatter_input: jsonFmt.length > 0 ? jsonFmt[0].content : null
      }
    };

    return c.json(exportManifest, 200, {
      'Content-Disposition': 'attachment; filename="kinetic-export.json"'
    });
  } catch (err) {
    return c.json({ error: 'Export failed' }, 500);
  }
});

app.post('/sync/import', protectedRoute, async (c) => {
  const user = c.get('user');
  try {
    const body = await c.req.json();
    if (!body || body.version !== 1 || !body.data) {
      return c.json({ error: 'Malformed export file' }, 400);
    }
    const { editor_docs, saved_pages } = body.data;
    if (Array.isArray(editor_docs)) {
      for (const doc of editor_docs) {
        await db.insert(schema.markdownDocs).values({
          id: doc.id,
          userId: user.id,
          name: doc.name,
          content: doc.content,
          updatedAt: new Date(doc.updatedAt || Date.now())
        }).onConflictDoUpdate({
          target: schema.markdownDocs.id,
          set: { content: doc.content, updatedAt: new Date() }
        });
      }
    }
    if (Array.isArray(saved_pages)) {
      for (const page of saved_pages) {
        await db.insert(schema.pages).values({
          id: page.id,
          userId: user.id,
          name: page.name,
          baseUrl: page.baseUrl,
          icon: page.icon,
          group: page.group,
          customActions: page.customActions,
          updatedAt: new Date(page.updatedAt || Date.now())
        }).onConflictDoUpdate({
          target: schema.pages.id,
          set: { baseUrl: page.baseUrl, group: page.group, updatedAt: new Date() }
        });
      }
    }
    return c.json({ success: true });
  } catch(e) {
    return c.json({ error: 'Import failed' }, 500);
  }
});

export const GET = handle(app);
export const POST = handle(app);
export default app;
