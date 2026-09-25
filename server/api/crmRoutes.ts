import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { getDb } from '../db/client';

export const crmRouter = Router();

function requireScope(req: any, res: any, next: any) {
  const organizationId = req.header('x-organization-id');
  const userId = req.header('x-user-id');
  if (!organizationId || !userId) return res.status(401).json({ error: 'Authentication context required' });
  req.scope = { organizationId, userId };
  next();
}

crmRouter.use(requireScope);

crmRouter.get('/customers', async (req: any, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const result = await getDb().query(
      `SELECT id, name, email, phone, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM customers WHERE organization_id = $1
       AND ($2 = '' OR name ILIKE '%' || $2 || '%' OR email ILIKE '%' || $2 || '%' OR phone ILIKE '%' || $2 || '%')
       ORDER BY created_at DESC LIMIT 100`,
      [req.scope.organizationId, q]
    );
    res.json({ data: result.rows });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to load customers' }); }
});

crmRouter.post('/customers', async (req: any, res) => {
  const name = String(req.body?.name || '').trim();
  if (!name) return res.status(422).json({ error: 'name is required' });
  const db = getDb();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const customer = await client.query(
      `INSERT INTO customers (organization_id, name, email, phone) VALUES ($1,$2,$3,$4)
       RETURNING id, name, email, phone, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [req.scope.organizationId, name, req.body.email || null, req.body.phone || null]
    );
    await client.query(
      `INSERT INTO audit_events (id, organization_id, actor_user_id, entity_type, entity_id, action, details)
       VALUES ($1,$2,$3,'customer',$4,'create',$5)`,
      [randomUUID(), req.scope.organizationId, req.scope.userId, customer.rows[0].id, JSON.stringify({ name })]
    );
    await client.query('COMMIT');
    res.status(201).json(customer.rows[0]);
  } catch (error) { await client.query('ROLLBACK'); console.error(error); res.status(500).json({ error: 'Failed to create customer' }); }
  finally { client.release(); }
});

crmRouter.get('/customers/:id', async (req: any, res) => {
  const result = await getDb().query(
    `SELECT id, name, email, phone, created_at AS "createdAt", updated_at AS "updatedAt" FROM customers WHERE id=$1 AND organization_id=$2`,
    [req.params.id, req.scope.organizationId]
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Customer not found' });
  res.json(result.rows[0]);
});

crmRouter.get('/enquiries', async (req: any, res) => {
  const result = await getDb().query(
    `SELECT id, customer_id AS "customerId", title, description, status, created_by AS "createdBy", created_at AS "createdAt", updated_at AS "updatedAt"
     FROM enquiries WHERE organization_id=$1 ORDER BY created_at DESC LIMIT 100`,
    [req.scope.organizationId]
  );
  res.json({ data: result.rows });
});

crmRouter.post('/enquiries', async (req: any, res) => {
  const customerId = String(req.body?.customerId || '');
  const title = String(req.body?.title || '').trim();
  if (!customerId || !title) return res.status(422).json({ error: 'customerId and title are required' });
  const db = getDb();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const customer = await client.query('SELECT id FROM customers WHERE id=$1 AND organization_id=$2', [customerId, req.scope.organizationId]);
    if (!customer.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Customer not found' }); }
    const enquiry = await client.query(
      `INSERT INTO enquiries (organization_id, customer_id, title, description, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, customer_id AS "customerId", title, description, status, created_by AS "createdBy", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [req.scope.organizationId, customerId, title, req.body.description || '', req.body.status || 'open', req.scope.userId]
    );
    await client.query(
      `INSERT INTO audit_events (id, organization_id, actor_user_id, entity_type, entity_id, action, details) VALUES ($1,$2,$3,'enquiry',$4,'create',$5)`,
      [randomUUID(), req.scope.organizationId, req.scope.userId, enquiry.rows[0].id, JSON.stringify({ title })]
    );
    await client.query('COMMIT');
    res.status(201).json(enquiry.rows[0]);
  } catch (error) { await client.query('ROLLBACK'); console.error(error); res.status(500).json({ error: 'Failed to create enquiry' }); }
  finally { client.release(); }
});

crmRouter.get('/enquiries/:id', async (req: any, res) => {
  const result = await getDb().query(
    `SELECT id, customer_id AS "customerId", title, description, status, created_by AS "createdBy", created_at AS "createdAt", updated_at AS "updatedAt" FROM enquiries WHERE id=$1 AND organization_id=$2`,
    [req.params.id, req.scope.organizationId]
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Enquiry not found' });
  res.json(result.rows[0]);
});

crmRouter.patch('/enquiries/:id', async (req: any, res) => {
  const allowed = ['open','in_progress','quoted','accepted','rejected','completed'];
  const status = req.body?.status;
  if (status !== undefined && !allowed.includes(status)) return res.status(422).json({ error: 'Invalid enquiry status' });
  const result = await getDb().query(
    `UPDATE enquiries SET title=COALESCE($3,title), description=COALESCE($4,description), status=COALESCE($5,status), updated_at=NOW()
     WHERE id=$1 AND organization_id=$2
     RETURNING id, customer_id AS "customerId", title, description, status, created_by AS "createdBy", created_at AS "createdAt", updated_at AS "updatedAt"`,
    [req.params.id, req.scope.organizationId, req.body.title ?? null, req.body.description ?? null, status ?? null]
  );
  if (!result.rowCount) return res.status(404).json({ error: 'Enquiry not found' });
  await getDb().query(
    `INSERT INTO audit_events (id, organization_id, actor_user_id, entity_type, entity_id, action, details) VALUES ($1,$2,$3,'enquiry','${req.params.id}','update',$4)`,
    [randomUUID(), req.scope.organizationId, req.scope.userId, JSON.stringify(req.body)]
  );
  res.json(result.rows[0]);
});
