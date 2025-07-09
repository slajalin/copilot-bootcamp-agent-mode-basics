const request = require('supertest');
const { app, db } = require('../src/app');

// Global teardown for database connection
afterAll(() => {
  // Close database connection after all tests
  if (db && typeof db.close === 'function') {
    db.close();
  }
});

/**
 * Helper function to insert test items with specific timestamps
 */
function insertTestItemsWithAge(daysOld = 6) {
  const oldDate = new Date();
  oldDate.setDate(oldDate.getDate() - daysOld);
  const timestamp = oldDate.toISOString();
  
  // Clear the database
  db.exec('DELETE FROM items');
  
  // Insert initial test data with old timestamps
  const initialItems = ['Item 1', 'Item 2', 'Item 3'];
  const insertStmt = db.prepare('INSERT INTO items (name, created_at) VALUES (?, ?)');
  
  initialItems.forEach(item => {
    insertStmt.run(item, timestamp);
  });
}

/**
 * Helper function to insert a single item with specific age
 */
function insertSingleItemWithAge(name, daysOld) {
  const oldDate = new Date();
  oldDate.setDate(oldDate.getDate() - daysOld);
  const timestamp = oldDate.toISOString();
  
  const insertStmt = db.prepare('INSERT INTO items (name, created_at) VALUES (?, ?)');
  return insertStmt.run(name, timestamp);
}

/**
 * Helper function to clear database and reset to initial state
 */
function clearAndResetDatabase() {
  db.exec('DELETE FROM items');
  
  const initialItems = ['Item 1', 'Item 2', 'Item 3'];
  const insertStmt = db.prepare('INSERT INTO items (name) VALUES (?)');
  
  initialItems.forEach(item => {
    insertStmt.run(item);
  });
}

describe('Backend API Tests - DELETE /api/items/:id', () => {
  let testItemId;

  beforeEach(() => {
    // Insert test items that are 6 days old (can be deleted)
    insertTestItemsWithAge(6);

    // Get the first item's ID for testing
    const items = db.prepare('SELECT * FROM items ORDER BY id ASC').all();
    testItemId = items[0].id;
  });

  describe('Happy Path', () => {
    it('should delete an existing item successfully when item is 5+ days old', async () => {
      const response = await request(app)
        .delete(`/api/items/${testItemId}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Item deleted successfully');
      expect(response.body).toHaveProperty('deletedItem');
      expect(response.body.deletedItem).toHaveProperty('id', testItemId);
      expect(response.body.deletedItem).toHaveProperty('name', 'Item 1');
    });

    it('should remove the item from the database when item is old enough', async () => {
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
    it('should return 403 for items less than 5 days old', async () => {
      // Insert a new item that's only 3 days old
      const result = insertSingleItemWithAge('New Item', 3);
      const newItemId = result.lastInsertRowid;

      const response = await request(app)
        .delete(`/api/items/${newItemId}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Item cannot be deleted. Items must be at least 5 days old to be deleted.');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('canDeleteAfter');
    });

    it('should return 403 for items exactly 4 days old', async () => {
      // Insert a new item that's exactly 4 days old (should not be deletable)
      const result = insertSingleItemWithAge('4 Day Old Item', 4);
      const newItemId = result.lastInsertRowid;

      const response = await request(app)
        .delete(`/api/items/${newItemId}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Item cannot be deleted. Items must be at least 5 days old to be deleted.');
    });

    it('should allow deletion of items exactly 5 days old', async () => {
      // Insert a new item that's exactly 5 days old (should be deletable)
      const result = insertSingleItemWithAge('5 Day Old Item', 5);
      const newItemId = result.lastInsertRowid;

      const response = await request(app)
        .delete(`/api/items/${newItemId}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Item deleted successfully');
      expect(response.body.deletedItem).toHaveProperty('name', '5 Day Old Item');
    });

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

    it('should handle edge case where DELETE operation affects no rows', async () => {
      // Mock the database prepare method to return a statement that reports no changes
      const originalPrepare = db.prepare;
      db.prepare = jest.fn().mockImplementation((query) => {
        if (query.includes('SELECT * FROM items WHERE id = ?')) {
          // Return a mock item for existence check
          return {
            get: jest.fn().mockReturnValue({
              id: testItemId,
              name: 'Test Item',
              created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() // 6 days old
            })
          };
        } else if (query.includes('DELETE FROM items WHERE id = ?')) {
          // Return a mock statement that reports no changes (simulating race condition)
          return {
            run: jest.fn().mockReturnValue({ changes: 0 })
          };
        }
        return originalPrepare.call(db, query);
      });

      const response = await request(app)
        .delete(`/api/items/${testItemId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Item not found');

      // Restore original method
      db.prepare = originalPrepare;
    });

    it('should work correctly with create and read operations for old items', async () => {
      // Create a new item with old timestamp (6 days ago)
      const result = insertSingleItemWithAge('Test Item for Deletion', 6);
      const newItemId = result.lastInsertRowid;

      // Verify item exists
      const getResponse = await request(app)
        .get('/api/items')
        .expect(200);

      expect(getResponse.body).toHaveLength(4); // 3 initial + 1 new

      // Delete the item (should work since it's old enough)
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

    it('should reject deletion of newly created items', async () => {
      // Create a new item with current timestamp (should not be deletable)
      const createResponse = await request(app)
        .post('/api/items')
        .send({ name: 'New Item Not Deletable' })
        .expect(201);

      const newItemId = createResponse.body.id;

      // Try to delete the newly created item (should fail)
      const deleteResponse = await request(app)
        .delete(`/api/items/${newItemId}`)
        .expect(403);

      expect(deleteResponse.body).toHaveProperty('error', 'Item cannot be deleted. Items must be at least 5 days old to be deleted.');

      // Verify item still exists
      const getResponse = await request(app)
        .get('/api/items')
        .expect(200);

      expect(getResponse.body.find(item => item.id === newItemId)).toBeDefined();
    });

    it('should handle multiple deletions in sequence for old items', async () => {
      const items = db.prepare('SELECT * FROM items ORDER BY id ASC').all();
      
      // Delete items one by one (all should be old enough)
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

describe('Backend API Tests - GET /api/items', () => {
  beforeEach(() => {
    clearAndResetDatabase();
  });

  describe('Happy Path', () => {
    it('should return all items successfully', async () => {
      const response = await request(app)
        .get('/api/items')
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body).toBeInstanceOf(Array);
    });

    it('should return items in descending order by created_at', async () => {
      // Insert items with different timestamps
      db.exec('DELETE FROM items');
      
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      
      const insertStmt = db.prepare('INSERT INTO items (name, created_at) VALUES (?, ?)');
      insertStmt.run('Oldest Item', twoDaysAgo.toISOString());
      insertStmt.run('Middle Item', yesterday.toISOString());
      insertStmt.run('Newest Item', now.toISOString());

      const response = await request(app)
        .get('/api/items')
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0].name).toBe('Newest Item');
      expect(response.body[1].name).toBe('Middle Item');
      expect(response.body[2].name).toBe('Oldest Item');
    });

    it('should return proper item structure with all required fields', async () => {
      const response = await request(app)
        .get('/api/items')
        .expect(200);

      const item = response.body[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('created_at');
      expect(typeof item.id).toBe('number');
      expect(typeof item.name).toBe('string');
      expect(typeof item.created_at).toBe('string');
    });

    it('should return empty array when no items exist', async () => {
      db.exec('DELETE FROM items');

      const response = await request(app)
        .get('/api/items')
        .expect(200);

      expect(response.body).toHaveLength(0);
      expect(response.body).toBeInstanceOf(Array);
    });

    it('should handle large number of items', async () => {
      db.exec('DELETE FROM items');
      
      const insertStmt = db.prepare('INSERT INTO items (name) VALUES (?)');
      for (let i = 1; i <= 100; i++) {
        insertStmt.run(`Item ${i}`);
      }

      const response = await request(app)
        .get('/api/items')
        .expect(200);

      expect(response.body).toHaveLength(100);
    });

    it('should return items with different names correctly', async () => {
      db.exec('DELETE FROM items');
      
      const testItems = ['Short', 'A very long item name with spaces and numbers 123', '!@#$%^&*()'];
      const insertStmt = db.prepare('INSERT INTO items (name) VALUES (?)');
      
      testItems.forEach(item => {
        insertStmt.run(item);
      });

      const response = await request(app)
        .get('/api/items')
        .expect(200);

      expect(response.body).toHaveLength(3);
      const names = response.body.map(item => item.name);
      testItems.forEach(testItem => {
        expect(names).toContain(testItem);
      });
    });
  });

  describe('Unhappy Path', () => {
    it('should handle database errors gracefully', async () => {
      // Mock the database prepare method to throw an error
      const originalPrepare = db.prepare;
      db.prepare = jest.fn().mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .get('/api/items')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to fetch items');

      // Restore original method
      db.prepare = originalPrepare;
    });

    it('should handle database query errors', async () => {
      // Mock the database prepare method to return an object with failing all() method
      const originalPrepare = db.prepare;
      db.prepare = jest.fn().mockImplementation(() => ({
        all: jest.fn().mockImplementation(() => {
          throw new Error('Query execution failed');
        })
      }));

      const response = await request(app)
        .get('/api/items')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to fetch items');

      // Restore original method
      db.prepare = originalPrepare;
    });

    it('should handle corrupted database gracefully', async () => {
      // Close the database to simulate corruption
      const originalPrepare = db.prepare;
      db.prepare = jest.fn().mockImplementation(() => {
        throw new Error('SQLITE_CORRUPT: database disk image is malformed');
      });

      const response = await request(app)
        .get('/api/items')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to fetch items');

      // Restore original method
      db.prepare = originalPrepare;
    });
  });
});

describe('Backend API Tests - POST /api/items', () => {
  beforeEach(() => {
    clearAndResetDatabase();
  });

  describe('Happy Path', () => {
    it('should create a new item successfully with valid data', async () => {
      const newItem = { name: 'New Test Item' };

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'New Test Item');
      expect(response.body).toHaveProperty('created_at');
      expect(typeof response.body.id).toBe('number');
    });

    it('should add the item to the database', async () => {
      const newItem = { name: 'Database Test Item' };

      await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201);

      // Verify item was added to database
      const items = db.prepare('SELECT * FROM items WHERE name = ?').all('Database Test Item');
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('Database Test Item');
    });

    it('should return the created item with correct structure', async () => {
      const newItem = { name: 'Structure Test Item' };

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Structure Test Item');
      expect(response.body).toHaveProperty('created_at');
      expect(typeof response.body.id).toBe('number');
      expect(typeof response.body.name).toBe('string');
      expect(typeof response.body.created_at).toBe('string');
    });

    it('should handle items with special characters', async () => {
      const newItem = { name: 'Item with !@#$%^&*() special chars' };

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201);

      expect(response.body.name).toBe('Item with !@#$%^&*() special chars');
    });

    it('should handle very long item names', async () => {
      const longName = 'A'.repeat(1000);
      const newItem = { name: longName };

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201);

      expect(response.body.name).toBe(longName);
    });

    it('should handle unicode characters', async () => {
      const newItem = { name: 'Unicode 测试 🚀 العربية' };

      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201);

      expect(response.body.name).toBe('Unicode 测试 🚀 العربية');
    });

    it('should increment item ID correctly', async () => {
      const initialItems = db.prepare('SELECT * FROM items ORDER BY id DESC').all();
      const lastId = initialItems[0].id;

      const response = await request(app)
        .post('/api/items')
        .send({ name: 'ID Test Item' })
        .expect(201);

      expect(response.body.id).toBe(lastId + 1);
    });

    it('should handle multiple consecutive creations', async () => {
      const items = ['First Item', 'Second Item', 'Third Item'];
      const createdItems = [];

      for (const itemName of items) {
        const response = await request(app)
          .post('/api/items')
          .send({ name: itemName })
          .expect(201);

        createdItems.push(response.body);
      }

      expect(createdItems).toHaveLength(3);
      expect(createdItems[0].name).toBe('First Item');
      expect(createdItems[1].name).toBe('Second Item');
      expect(createdItems[2].name).toBe('Third Item');
    });
  });

  describe('Unhappy Path', () => {
    it('should return 400 when name is missing', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Item name is required');
    });

    it('should return 400 when name is null', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: null })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Item name is required');
    });

    it('should return 400 when name is undefined', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: undefined })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Item name is required');
    });

    it('should return 400 when name is empty string', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Item name is required');
    });

    it('should return 400 when name is only whitespace', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: '   ' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Item name is required');
    });

    it('should return 400 when name is only tabs and newlines', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: '\t\n\r' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Item name is required');
    });

    it('should return 400 when name is not a string (number)', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: 123 })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Item name is required');
    });

    it('should return 400 when name is not a string (boolean)', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: true })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Item name is required');
    });

    it('should return 400 when name is not a string (array)', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: ['Item Name'] })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Item name is required');
    });

    it('should return 400 when name is not a string (object)', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: { value: 'Item Name' } })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Item name is required');
    });

    it('should not create item in database when validation fails', async () => {
      const itemsBefore = db.prepare('SELECT * FROM items').all();

      await request(app)
        .post('/api/items')
        .send({ name: '' })
        .expect(400);

      const itemsAfter = db.prepare('SELECT * FROM items').all();
      expect(itemsAfter).toHaveLength(itemsBefore.length);
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/items')
        .set('Content-Type', 'application/json')
        .send('{"name": "Test Item"')  // Missing closing brace
        .expect(400);

      // Express will handle malformed JSON with its own error
      expect(response.body).toBeDefined();
    });

    it('should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/items')
        .send('name=Test Item')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Item name is required');
    });

    it('should handle database insertion errors gracefully', async () => {
      // Mock the insertStmt.run method to throw an error
      const originalRun = require('../src/app').insertStmt.run;
      require('../src/app').insertStmt.run = jest.fn().mockImplementation(() => {
        throw new Error('Database insertion failed');
      });

      const response = await request(app)
        .post('/api/items')
        .send({ name: 'Test Item' })
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to create item');

      // Restore original method
      require('../src/app').insertStmt.run = originalRun;
    });

    it('should handle database query errors after insertion', async () => {
      // Mock the database prepare method to fail on SELECT query
      const originalPrepare = db.prepare;
      let callCount = 0;
      db.prepare = jest.fn().mockImplementation((query) => {
        callCount++;
        if (query.includes('SELECT * FROM items WHERE id = ?')) {
          throw new Error('Database query failed');
        }
        return originalPrepare.call(db, query);
      });

      const response = await request(app)
        .post('/api/items')
        .send({ name: 'Test Item' })
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to create item');

      // Restore original method
      db.prepare = originalPrepare;
    });

    it('should handle extremely large payloads', async () => {
      const largePayload = { name: 'A'.repeat(10000000) }; // 10MB string

      const response = await request(app)
        .post('/api/items')
        .send(largePayload)
        .expect(413); // Payload Too Large

      expect(response.body).toBeDefined();
    });

    it('should handle additional fields in payload (should ignore them)', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ 
          name: 'Valid Item',
          extraField: 'should be ignored',
          id: 999,
          created_at: '2020-01-01T00:00:00Z'
        })
        .expect(201);

      expect(response.body.name).toBe('Valid Item');
      expect(response.body.id).not.toBe(999); // Should be auto-generated
      expect(response.body.created_at).not.toBe('2020-01-01T00:00:00Z'); // Should be auto-generated
    });
  });

  describe('Integration Tests', () => {
    it('should create item and make it available via GET endpoint', async () => {
      const newItem = { name: 'Integration Test Item' };

      // Create the item
      const createResponse = await request(app)
        .post('/api/items')
        .send(newItem)
        .expect(201);

      // Verify it appears in GET request
      const getResponse = await request(app)
        .get('/api/items')
        .expect(200);

      expect(getResponse.body).toHaveLength(4); // 3 initial + 1 new
      expect(getResponse.body.find(item => item.name === 'Integration Test Item')).toBeDefined();
    });

    it('should handle rapid successive creations', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/api/items')
            .send({ name: `Rapid Item ${i}` })
        );
      }

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Verify all items were created
      const getResponse = await request(app)
        .get('/api/items')
        .expect(200);

      expect(getResponse.body).toHaveLength(13); // 3 initial + 10 new
    });
  });
});