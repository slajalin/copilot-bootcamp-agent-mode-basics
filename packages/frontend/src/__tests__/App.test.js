import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

/**
 * Test suite for App component delete functionality
 * Tests both happy and unhappy paths for item deletion
 */

// Mock data for tests
const mockItems = [
  { id: 1, name: 'Test Item 1', created_at: '2023-01-01T00:00:00Z' },
  { id: 2, name: 'Test Item 2', created_at: '2023-01-02T00:00:00Z' },
  { id: 3, name: 'Test Item 3', created_at: '2023-01-03T00:00:00Z' },
];

// MSW server setup
const server = setupServer(
  // Default handler for fetching items
  rest.get('/api/items', (req, res, ctx) => {
    return res(ctx.json(mockItems));
  }),
  // Default handler for deleting items
  rest.delete('/api/items/:id', (req, res, ctx) => {
    return res(ctx.status(200));
  })
);

// Setup and teardown
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('App Delete Functionality', () => {
  describe('Happy Path', () => {
    beforeEach(async () => {
      render(<App />);
      // Wait for initial data load
      await waitFor(() => {
        expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      });
    });

    it('should render delete buttons for each item', () => {
      const deleteButtons = screen.getAllByLabelText(/Delete/);
      expect(deleteButtons).toHaveLength(3);
      
      // Check each button has correct aria-label
      expect(screen.getByLabelText('Delete Test Item 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete Test Item 2')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete Test Item 3')).toBeInTheDocument();
    });

    it('should open confirmation dialog when delete button is clicked', async () => {
      const deleteButton = screen.getByLabelText('Delete Test Item 1');
      
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to delete "Test Item 1"/)).toBeInTheDocument();
      });
    });

    it('should show cancel and delete buttons in confirmation dialog', async () => {
      const deleteButton = screen.getByLabelText('Delete Test Item 1');
      
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
      });
    });

    it('should close dialog when cancel is clicked', async () => {
      const deleteButton = screen.getByLabelText('Delete Test Item 1');
      
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
      });
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
      });
    });

    it('should successfully delete item when confirmed', async () => {
      const deleteButton = screen.getByLabelText('Delete Test Item 1');
      
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(confirmButton);
      
      // Wait for deletion to complete and dialog to close
      await waitFor(() => {
        expect(screen.queryByText('Test Item 1')).not.toBeInTheDocument();
      });
      
      // Verify dialog is closed
      await waitFor(() => {
        expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
      });
      
      // Verify other items are still there
      expect(screen.getByText('Test Item 2')).toBeInTheDocument();
      expect(screen.getByText('Test Item 3')).toBeInTheDocument();
    });

    it('should show loading state during deletion', async () => {
      // Mock a slow delete response
      server.use(
        rest.delete('/api/items/:id', (req, res, ctx) => {
          return res(ctx.delay(100), ctx.status(200));
        })
      );

      const deleteButton = screen.getByLabelText('Delete Test Item 1');
      
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(confirmButton);
      
      // Check for loading spinner in the delete button
      await waitFor(() => {
        expect(screen.getByLabelText('Delete Test Item 1')).toBeDisabled();
      });
    });

    it('should handle multiple items deletion correctly', async () => {
      // Delete first item
      const deleteButton1 = screen.getByLabelText('Delete Test Item 1');
      fireEvent.click(deleteButton1);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
      });
      
      const confirmButton1 = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(confirmButton1);
      
      await waitFor(() => {
        expect(screen.queryByText('Test Item 1')).not.toBeInTheDocument();
      });
      
      // Delete second item
      const deleteButton2 = screen.getByLabelText('Delete Test Item 2');
      fireEvent.click(deleteButton2);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
      });
      
      const confirmButton2 = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(confirmButton2);
      
      await waitFor(() => {
        expect(screen.queryByText('Test Item 2')).not.toBeInTheDocument();
      });
      
      // Verify only one item remains
      expect(screen.getByText('Test Item 3')).toBeInTheDocument();
    });
  });

  describe('Unhappy Path', () => {
    beforeEach(async () => {
      render(<App />);
      // Wait for initial data load
      await waitFor(() => {
        expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      });
    });

    it('should show error message when delete fails', async () => {
      // Mock delete failure
      server.use(
        rest.delete('/api/items/:id', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Internal Server Error' }));
        })
      );

      const deleteButton = screen.getByLabelText('Delete Test Item 1');
      
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(confirmButton);
      
      // Wait for error message to appear
      await waitFor(() => {
        expect(screen.getByText(/Error deleting item/)).toBeInTheDocument();
      });
      
      // Verify item is still in the list
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      
      // Verify dialog is closed
      await waitFor(() => {
        expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
      });
    });

    it('should handle network error during deletion', async () => {
      // Mock network error
      server.use(
        rest.delete('/api/items/:id', (req, res, ctx) => {
          return res.networkError('Network error');
        })
      );

      const deleteButton = screen.getByLabelText('Delete Test Item 1');
      
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(confirmButton);
      
      // Wait for error message to appear
      await waitFor(() => {
        expect(screen.getByText(/Error deleting item/)).toBeInTheDocument();
      });
      
      // Verify item is still in the list
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    it('should handle 404 error when item not found', async () => {
      // Mock 404 error
      server.use(
        rest.delete('/api/items/:id', (req, res, ctx) => {
          return res(ctx.status(404), ctx.json({ error: 'Item not found' }));
        })
      );

      const deleteButton = screen.getByLabelText('Delete Test Item 1');
      
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(confirmButton);
      
      // Wait for error message to appear
      await waitFor(() => {
        expect(screen.getByText(/Error deleting item/)).toBeInTheDocument();
      });
      
      // Verify item is still in the list
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    it('should not allow multiple delete operations on the same item', async () => {
      // Mock a slow delete response
      server.use(
        rest.delete('/api/items/:id', (req, res, ctx) => {
          return res(ctx.delay(1000), ctx.status(200));
        })
      );

      const deleteButton = screen.getByLabelText('Delete Test Item 1');
      
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(confirmButton);
      
      // Wait for loading state
      await waitFor(() => {
        expect(screen.getByLabelText('Delete Test Item 1')).toBeDisabled();
      });
      
      // Verify the button is disabled and shows loading
      const disabledButton = screen.getByLabelText('Delete Test Item 1');
      expect(disabledButton).toBeDisabled();
      
      // Try to click again - should not work
      fireEvent.click(disabledButton);
      
      // Should still be disabled
      expect(disabledButton).toBeDisabled();
    });

    it('should close dialog and maintain item when escape key is pressed', async () => {
      const deleteButton = screen.getByLabelText('Delete Test Item 1');
      
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
      });
      
      // Press escape key
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      
      await waitFor(() => {
        expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
      });
      
      // Verify item is still in the list
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    it('should handle empty items list after all deletions', async () => {
      // Delete all items one by one
      const items = ['Test Item 1', 'Test Item 2', 'Test Item 3'];
      
      for (const itemName of items) {
        const deleteButton = screen.getByLabelText(`Delete ${itemName}`);
        fireEvent.click(deleteButton);
        
        await waitFor(() => {
          expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
        });
        
        const confirmButton = screen.getByRole('button', { name: 'Delete' });
        fireEvent.click(confirmButton);
        
        await waitFor(() => {
          expect(screen.queryByText(itemName)).not.toBeInTheDocument();
        });
      }
      
      // Verify empty state message is shown
      expect(screen.getByText('No items found. Add some items to get started!')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      render(<App />);
      // Wait for initial data load
      await waitFor(() => {
        expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      });
    });

    it('should have proper ARIA labels for delete buttons', () => {
      const deleteButtons = screen.getAllByLabelText(/Delete/);
      
      deleteButtons.forEach((button, index) => {
        expect(button).toHaveAttribute('aria-label', `Delete Test Item ${index + 1}`);
      });
    });

    it('should have proper dialog accessibility attributes', async () => {
      const deleteButton = screen.getByLabelText('Delete Test Item 1');
      
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-labelledby', 'delete-dialog-title');
        expect(dialog).toHaveAttribute('aria-describedby', 'delete-dialog-description');
      });
    });

    it('should focus management in delete dialog', async () => {
      const deleteButton = screen.getByLabelText('Delete Test Item 1');
      
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
      });
      
      // The dialog should be focused or contain focus
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      // Cancel button should be focusable
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      expect(cancelButton).not.toBeDisabled();
      
      // Delete button should be focusable
      const confirmButton = screen.getByRole('button', { name: 'Delete' });
      expect(confirmButton).not.toBeDisabled();
    });
  });
});
