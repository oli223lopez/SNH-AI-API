import supertest from 'supertest';
import express from 'express';
import { Database } from 'sqlite';
import { initDb } from '../db/index';
import { TreeController } from '../controllers/treeController';
import {treeRouter} from '../routes/treeRouter';

describe('Tree Router', () => {
  let app: express.Express;
  let db: Database;
  let treeController: TreeController;

  beforeEach(async () => {
    db = await initDb(':memory:');
    treeController = new TreeController(db);
    app = express();
    app.use(treeRouter(treeController));
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (err instanceof SyntaxError && 'body' in err) {
        res.status(400).json({ error: 'Invalid JSON format' });
      }
      next(err);
    });
  });

  afterEach(async () => {
    await db.close();
  });

  describe('GET /api', () => {
    it('returns API welcome message', async () => {
      const response = await supertest(app).get('/api').expect(200);
      expect(response.text).toBe('SNH AI Tree API');
    });
  });

  describe('POST /api/tree', () => {
    it('creates a root node with null parentId', async () => {
      const response = await supertest(app)
        .post('/api/tree')
        .send({ label: 'root', parentId: null })
        .expect(201);
      expect(response.body).toEqual({
        message: 'Node was successfully added to the tree',
        createdNode: { id: 1, label: 'root', parentId: null, children: [] },
      });
    });

    it('creates a child node with numeric parentId', async () => {
      await treeController.createTree({ label: 'root', parentId: null });
      const response = await supertest(app)
        .post('/api/tree')
        .send({ label: 'child', parentId: 1 })
        .expect(201);
      expect(response.body).toEqual({
        message: 'Node was successfully added to the tree',
        createdNode: { id: 2, label: 'child', parentId: 1, children: [] },
      });
    });

    it('creates a child node with string parentId', async () => {
      await treeController.createTree({ label: 'root', parentId: null });
      const response = await supertest(app)
        .post('/api/tree')
        .send({ label: 'child', parentId: '1' })
        .expect(201);
      expect(response.body).toEqual({
        message: 'Node was successfully added to the tree',
        createdNode: { id: 2, label: 'child', parentId: 1, children: [] },
      });
    });

    it('rejects invalid parentId', async () => {
      const response = await supertest(app)
        .post('/api/tree')
        .send({ label: 'child', parentId: 'abc' })
        .expect(400);
      expect(response.body).toEqual({ error: 'Parent ID must be a positive number or null' });
    });

    it('rejects non-existent parentId', async () => {
      const response = await supertest(app)
        .post('/api/tree')
        .send({ label: 'child', parentId: 999 })
        .expect(404);
      expect(response.body).toEqual({ error: 'Parent node not found' });
    });

    it('rejects missing label', async () => {
      const response = await supertest(app)
        .post('/api/tree')
        .send({ parentId: null })
        .expect(400);
      expect(response.body).toEqual({ error: 'Label must be a non-empty string' });
    });

    it('rejects duplicate label', async () => {
      await treeController.createTree({ label: 'root', parentId: null });
      const response = await supertest(app)
        .post('/api/tree')
        .send({ label: 'root', parentId: null })
        .expect(400);
      expect(response.body).toEqual({ error: 'Label already exists' });
    });

    it('rejects malformed JSON', async () => {
      const response = await supertest(app)
        .post('/api/tree')
        .set('Content-Type', 'application/json')
        .send('{ "label": "root"') // Malformed JSON
        .expect(400);
      expect(response.body).toMatchObject({ error: expect.any(String) }); // Express parses as 400
    });

    it('rejects missing Content-Type', async () => {
      const response = await supertest(app)
        .post('/api/tree')
        .send('label=root&parentId=null') // No Content-Type
        .expect(400);
      expect(response.body).toEqual({ error: 'Request body was undefined. Please check your request' });
    });

    it('rejects unsupported methods', async () => {
      const response = await supertest(app)
        .put('/api/tree')
        .send({ label: 'root', parentId: null })
        .expect(404); // Express returns 404 for undefined routes
      expect(response.body).toMatchObject({});
    });

    it('handles database errors', async () => {
      jest.spyOn(treeController, 'createTree').mockRejectedValue(new Error('SQLITE_CONSTRAINT: FOREIGN KEY'));
      const response = await supertest(app)
        .post('/api/tree')
        .send({ label: 'root', parentId: 7 })
        .expect(400);
      expect(response.body).toEqual({ error: 'SQLITE_CONSTRAINT: FOREIGN KEY' });
    });
  });

  describe('GET /api/trees', () => {
    it('returns empty array when no nodes exist', async () => {
      const response = await supertest(app).get('/api/trees').expect(200);
      expect(response.body).toEqual([]);
    });

    it('returns nested tree structure', async () => {
      await treeController.createTree({ label: 'root', parentId: null });
      await treeController.createTree({ label: 'child', parentId: 1 });
      const response = await supertest(app).get('/api/trees').expect(200);
      expect(response.body).toEqual([
        {
          id: 1,
          label: 'root',
          parentId: null,
          children: [{ id: 2, label: 'child', parentId: 1, children: [] }],
        },
      ]);
    });
  });

  describe('GET /api/tree/:id', () => {
    it('returns node by id', async () => {
      await treeController.createTree({ label: 'root', parentId: null });
      const response = await supertest(app).get('/api/tree/1').expect(200);
      expect(response.body).toEqual({
        id: 1,
        label: 'root',
        parentId: null,
        children: [],
      });
    });

    it('returns 404 for non-existent node', async () => {
      const response = await supertest(app).get('/api/tree/999').expect(404);
      expect(response.body).toEqual({ error: 'Node not found' });
    });

    it('returns 400 for invalid id', async () => {
      const response = await supertest(app).get('/api/tree/abc').expect(400);
      expect(response.body).toEqual({ error: 'ID must be a positive number' });
    });
  });
});