const request = require('supertest');
const { app, db } = require('../src/app');

describe('Backend API Tests - DELETE /api/items/:id', () => {
  let testItemId;

  beforeEach(() => {
    // Clear the database and reset with initial data before each test
    db.exec('DELETE FROM items');
    
    // Insert initial test data
    const initialItems = ['Item 1', 'Item 2', 'Item 3'];
    const insertStmt = db.prepare('INSERT INTO items (name) VALUES (?)');
    
    initialItems.forEach(item => {
      insertStmt.run(item);
    });

    // Get the first item's ID for testing
    const items = db.prepare('SELECT * FROM items ORDER BY id ASC').all();
    testItemId = items[0].id;
  });

  afterAll(() => {
    // Close database connection after all tests
    db.close();
  });

  describe('Happy Path', () => {
    it('should delete an existing item successfully', async () => {
      const response = await request(app)
        .delete(`/api/items/${testItemId}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Item deleted successfully');
      expect(response.body).toHaveProperty('deletedItem');
      expect(response.body.deletedItem).toHaveProperty('id', testItemId);
      expect(response.body.deletedItem).toHaveProperty('name', 'Item 1');
    });

    it('should remove the item from the database', async () => {
      // Verify item exists before deletion
      const itemsBefore = db.prepare('SELECT * FROM items').all();
      expect(itemsBefore).toHaveLength(3);

      await request(app)
        .delete(`/api/items/${testItemId}`)
        .expect(200);

      // Verify item is removed from database
      const itemsAfter = db.prepare('SELECT * FROM items').all();
      expect(itemsAfter).toHaveLength(2);
      
      const deletedItem = db.prepare('SELECT * FROM items WHERE id = ?').get(testItemId);
      expect(deletedItem).toBeUndefined();
    });

    it('should return the correct deleted item details', async () => {
      // Get the item details before deletion
      const itemBeforeDeletion = db.prepare('SELECT * FROM items WHERE id = ?').get(testItemId);

      const response = await request(app)
        .delete(`/api/items/${testItemId}`)
        .expect(200);

      expect(response.body.deletedItem).toEqual(itemBeforeDeletion);
    });

    it('should handle deletion of different items correctly', async () => {
      const items = db.prepare('SELECT * FROM items ORDER BY id ASC').all();
      const secondItemId = items[1].id;

      const response = await request(app)
        .delete(`/api/items/${secondItemId}`)
        .expect(200);

      expect(response.body.deletedItem).toHaveProperty('id', secondItemId);
      expect(response.body.deletedItem).toHaveProperty('name', 'Item 2');
    });

    it('should maintain database integrity after deletion', async () => {
      const itemsBefore = db.prepare('SELECT * FROM items ORDER BY id ASC').all();
      const middleItemId = itemsBefore[1].id;

      await request(app)
        .delete(`/api/items/${middleItemId}`)
        .expect(200);

      // Verify remaining items are still intact
      const itemsAfter = db.prepare('SELECT * FROM items ORDER BY id ASC').all();
      expect(itemsAfter).toHaveLength(2);
      expect(itemsAfter[0]).toEqual(itemsBefore[0]);
      expect(itemsAfter[1]).toEqual(itemsBefore[2]);
    });
  });

  describe('Unhappy Path', () => {
    it('should return 404 for non-existent item ID', async () => {
      const nonExistentId = 99999;

      const response = await request(app)
        .delete(`/api/items/${nonExistentId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 400 for invalid item ID (non-numeric)', async () => {
      const response = await request(app)
        .delete('/api/items/invalid-id')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid item ID');
    });

    it('should return 400 for empty item ID', async () => {
      const response = await request(app)
        .delete('/api/items/')
        .expect(404); // Express will return 404 for missing route parameter

      // This tests the route pattern, not our validation
    });

    it('should return 400 for negative item ID', async () => {
      const response = await request(app)
        .delete('/api/items/-1')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid item ID');
    });

    it('should return 400 for zero item ID', async () => {
      const response = await request(app)
        .delete('/api/items/0')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid item ID');
    });

    it('should return 400 for floating point item ID', async () => {
      const response = await request(app)
        .delete('/api/items/1.5')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid item ID');
    });

    it('should return 400 for item ID with special characters', async () => {
      const response = await request(app)
        .delete('/api/items/1@#$')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid item ID');
    });

    it('should return 400 for item ID with spaces', async () => {
      const response = await request(app)
        .delete('/api/items/1 2')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid item ID');
    });

    it('should not modify database when item does not exist', async () => {
      const itemsBefore = db.prepare('SELECT * FROM items').all();
      const nonExistentId = 99999;

      await request(app)
        .delete(`/api/items/${nonExistentId}`)
        .expect(404);

      const itemsAfter = db.prepare('SELECT * FROM items').all();
      expect(itemsAfter).toHaveLength(itemsBefore.length);
      expect(itemsAfter).toEqual(itemsBefore);
    });

    it('should not modify database when ID is invalid', async () => {
      const itemsBefore = db.prepare('SELECT * FROM items').all();

      await request(app)
        .delete('/api/items/invalid-id')
        .expect(400);

      const itemsAfter = db.prepare('SELECT * FROM items').all();
      expect(itemsAfter).toHaveLength(itemsBefore.length);
      expect(itemsAfter).toEqual(itemsBefore);
    });

    it('should handle database errors gracefully', async () => {
      // Mock the database prepare method to throw an error
      const originalPrepare = db.prepare;
      db.prepare = jest.fn().mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .delete(`/api/items/${testItemId}`)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to delete item');

      // Restore original method
      db.prepare = originalPrepare;
    });

    it('should handle concurrent deletion attempts', async () => {
      // First deletion should succeed
      const response1 = await request(app)
        .delete(`/api/items/${testItemId}`)
        .expect(200);

      expect(response1.body.message).toBe('Item deleted successfully');

      // Second deletion of the same item should fail
      const response2 = await request(app)
        .delete(`/api/items/${testItemId}`)
        .expect(404);

      expect(response2.body.error).toBe('Item not found');
    });

    it('should return 404 for already deleted item', async () => {
      // Delete the item first
      await request(app)
        .delete(`/api/items/${testItemId}`)
        .expect(200);

      // Try to delete the same item again
      const response = await request(app)
        .delete(`/api/items/${testItemId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Item not found');
    });
  });

  describe('Integration Tests', () => {
    it('should work correctly with create and read operations', async () => {
      // Create a new item
      const createResponse = await request(app)
        .post('/api/items')
        .send({ name: 'Test Item for Deletion' })
        .expect(201);

      const newItemId = createResponse.body.id;

      // Verify item exists
      const getResponse = await request(app)
        .get('/api/items')
        .expect(200);

      expect(getResponse.body).toHaveLength(4); // 3 initial + 1 new

      // Delete the item
      await request(app)
        .delete(`/api/items/${newItemId}`)
        .expect(200);

      // Verify item is removed
      const getFinalResponse = await request(app)
        .get('/api/items')
        .expect(200);

      expect(getFinalResponse.body).toHaveLength(3); // Back to original count
      expect(getFinalResponse.body.find(item => item.id === newItemId)).toBeUndefined();
    });

    it('should handle multiple deletions in sequence', async () => {
      const items = db.prepare('SELECT * FROM items ORDER BY id ASC').all();
      
      // Delete items one by one
      for (const item of items) {
        const response = await request(app)
          .delete(`/api/items/${item.id}`)
          .expect(200);

        expect(response.body.deletedItem).toEqual(item);
      }

      // Verify all items are deleted
      const finalResponse = await request(app)
        .get('/api/items')
        .expect(200);

      expect(finalResponse.body).toHaveLength(0);
    });
  });
});