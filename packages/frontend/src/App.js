import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import './App.css';

// Create MUI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/items');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data: ' + err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!newItem.trim()) return;

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newItem }),
      });

      if (!response.ok) {
        throw new Error('Failed to add item');
      }

      const result = await response.json();
      setData([...data, result]);
      setNewItem('');
    } catch (err) {
      setError('Error adding item: ' + err.message);
      console.error('Error adding item:', err);
    }
  };

  const handleDelete = async itemId => {
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      // Remove the item from the local state
      setData(data.filter(item => item.id !== itemId));
      setError(null);
    } catch (err) {
      setError('Error deleting item: ' + err.message);
      console.error('Error deleting item:', err);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 3, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Hello World
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Connected to in-memory database
          </Typography>
        </Paper>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Add New Item
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <TextField
                fullWidth
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                placeholder="Enter item name"
                variant="outlined"
                size="medium"
              />
              <Button type="submit" variant="contained" color="primary" sx={{ minWidth: 120 }}>
                Add Item
              </Button>
            </Box>
          </Paper>

          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Items from Database
            </Typography>
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            )}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            {!loading &&
              !error &&
              (data.length > 0 ? (
                <TableContainer sx={{ mt: 2 }}>
                  <Table sx={{ minWidth: 650 }} aria-label="items table">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Created At</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.map(item => (
                        <TableRow key={item.id} hover>
                          <TableCell>{item.id}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                          <TableCell align="center">
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => handleDelete(item.id)}
                              aria-label={`Delete ${item.name}`}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography
                  variant="body1"
                  sx={{ textAlign: 'center', mt: 2, color: 'text.secondary' }}
                >
                  No items found. Add some!
                </Typography>
              ))}
          </Paper>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
