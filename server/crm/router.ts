import { Router } from 'express';
import { getDb } from '../db/client';
import { requireAuth, requirePermission } from '../auth/context';

const router = Router();
router.use(requireAuth);

router.get('/customers', requirePermission('customers.read'), async (req, res) => {
  try {
    const result = await getDb().query(
      `SELECT id, name, email, phone, company, created_at, updated_at
       FROM customers WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [req.auth!.organizationId]
    );
    res.json({ items: result.rows });
  } catch {
    res.status(500).json({ error: 'Failed to list customers' });
  }
});

router.post('/customers', requirePermission('customers.write'), async (req, res) => {
  const { name, email, phone, company } = req.body ?? {};
  if (!name || typeof name !== 'string') return res.status(422).json({ error: 'name is required' });
  try {
    const db = getDb();
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const customer = await client.query(
        `INSERT INTO customers (organization_id, name, email, phone, company)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING id, name, email, phone, company, created_at, updated_at`,
        [req.auth!.organizationId, name.trim(), email ?? null, phone ?? null, company ?? null]
      );
      await client.query(
        `INSERT INTO audit_events (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
         VALUES ($1,$2,'customer.created','customer',$3,$4)`,
        [req.auth!.organizationId, req.auth!.userId, customer.rows[0].id, JSON.stringify({})]
      );
      await client.query('COMMIT');
      res.status(201).json(customer.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch {
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

router.get('/customers/:id', requirePermission('customers.read'), async (req, res) => {
  try {
    const result = await getDb().query(
      `SELECT id, name, email, phone, company, created_at, updated_at
       FROM customers WHERE id = $1 AND organization_id = $2`,
      [req.params.id, req.auth!.organizationId]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Customer not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to get customer' });
  }
});

router.get('/enquiries', requirePermission('enquiries.read'), async (req, res) => {
  try {
    const result = await getDb().query(
      `SELECT id, customer_id, title, description, status, priority, created_at, updated_at
       FROM enquiries WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [req.auth!.organizationId]
    );
    res.json({ items: result.rows });
  } catch {
    res.status(500).json({ error: 'Failed to list enquiries' });
  }
});

router.post('/enquiries', requirePermission('enquiries.write'), async (req, res) => {
  const { customerId, title, description, priority = 'medium' } = req.body ?? {};
  if (!customerId || !title) return res.status(422).json({ error: 'customerId and title are required' });
  const validPriority = ['low', 'medium', 'high', 'urgent'];
  if (!validPriority.includes(priority)) return res.status(422).json({ error: 'Invalid priority' });
  try {
    const db = getDb();
    const customer = await db.query('SELECT id FROM customers WHERE id = $1 AND organization_id = $2', [customerId, req.auth!.organizationId]);
    if (!customer.rowCount) return res.status(404).json({ error: 'Customer not found' });
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const enquiry = await client.query(
        `INSERT INTO enquiries (organization_id, customer_id, title, description, priority)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING id, customer_id, title, description, status, priority, created_at, updated_at`,
        [req.auth!.organizationId, customerId, title.trim(), description ?? null, priority]
      );
      await client.query(
        `INSERT INTO audit_events (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
         VALUES ($1,$2,'enquiry.created','enquiry',$3,$4)`,
        [req.auth!.organizationId, req.auth!.userId, enquiry.rows[0].id, JSON.stringify({})]
      );
      await client.query('COMMIT');
      res.status(201).json(enquiry.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch {
    res.status(500).json({ error: 'Failed to create enquiry' });
  }
});

router.get('/enquiries/:id', requirePermission('enquiries.read'), async (req, res) => {
  try {
    const result = await getDb().query(
      `SELECT id, customer_id, title, description, status, priority, created_at, updated_at
       FROM enquiries WHERE id = $1 AND organization_id = $2`,
      [req.params.id, req.auth!.organizationId]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Enquiry not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to get enquiry' });
  }
});

export default router;
