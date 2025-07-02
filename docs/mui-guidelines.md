# Material-UI (MUI) Guidelines

This document outlines the guidelines and best practices for using Material-UI (MUI) components in this project.

## Overview

Material-UI is a popular React component library that implements Google's Material Design. It provides a comprehensive set of pre-built components that follow Material Design principles, ensuring consistency and accessibility across the application.

## Installation

To add MUI to the project, install the core package and any additional dependencies:

```bash
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material  # For icons
npm install @mui/lab  # For experimental components
```

For styling, you can also install the MUI system:

```bash
npm install @mui/system
```

## Core Principles

### 1. Component Usage

- **Use MUI components over custom HTML elements** when available
- **Follow MUI naming conventions** for props and component usage
- **Leverage the theme system** for consistent styling across the application
- **Use MUI's responsive breakpoints** for mobile-first design

### 2. Theme Configuration

Create a centralized theme configuration to maintain consistency:

```javascript
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

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
  spacing: 8, // Default spacing unit
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Your app components */}
    </ThemeProvider>
  );
}
```

### 3. Styling Approaches

MUI offers several styling solutions. Use them in this order of preference:

1. **Theme-based styling** - Use theme tokens for colors, spacing, typography
2. **sx prop** - For component-specific styling with theme access
3. **styled() API** - For reusable styled components
4. **CSS-in-JS** - Only when other methods are insufficient

## Component Guidelines

### Layout Components

#### Container and Grid
```javascript
import { Container, Grid, Box } from '@mui/material';

function Layout() {
  return (
    <Container maxWidth="lg">
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Box sx={{ p: 2 }}>Content</Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ p: 2 }}>Content</Box>
        </Grid>
      </Grid>
    </Container>
  );
}
```

#### Tables
For data display, use MUI's Table components instead of HTML tables:

```javascript
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';

function DataTable({ data }) {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="data table">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Created At</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
              <TableCell align="center">
                <Button variant="outlined" color="error" size="small">
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
```

### Form Components

Use MUI form components for consistent form styling:

```javascript
import { TextField, Button, FormControl, InputLabel } from '@mui/material';

function ItemForm({ onSubmit }) {
  return (
    <Box component="form" onSubmit={onSubmit} sx={{ mt: 2 }}>
      <TextField
        fullWidth
        label="Item Name"
        variant="outlined"
        margin="normal"
        required
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        sx={{ mt: 2 }}
      >
        Add Item
      </Button>
    </Box>
  );
}
```

### Navigation Components

#### App Bar
```javascript
import { AppBar, Toolbar, Typography } from '@mui/material';

function Header() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          My Application
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
```

### Feedback Components

#### Loading States
```javascript
import { CircularProgress, Skeleton } from '@mui/material';

function LoadingComponent() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
      <CircularProgress />
    </Box>
  );
}

// For content placeholders
function SkeletonLoader() {
  return (
    <Box>
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="rectangular" height={200} />
    </Box>
  );
}
```

#### Error States
```javascript
import { Alert, AlertTitle } from '@mui/material';

function ErrorMessage({ message }) {
  return (
    <Alert severity="error" sx={{ mt: 2 }}>
      <AlertTitle>Error</AlertTitle>
      {message}
    </Alert>
  );
}
```

## Responsive Design

### Breakpoints
Use MUI's breakpoint system for responsive design:

```javascript
import { useTheme, useMediaQuery } from '@mui/material';

function ResponsiveComponent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' },
      gap: { xs: 1, md: 2 }
    }}>
      {/* Content */}
    </Box>
  );
}
```

### Responsive Props
Many MUI components accept responsive props:

```javascript
<Grid item xs={12} sm={6} md={4} lg={3}>
  <Button size={{ xs: 'small', md: 'medium' }}>
    Responsive Button
  </Button>
</Grid>
```

## Accessibility

### ARIA Labels
Always provide proper ARIA labels for interactive elements:

```javascript
<IconButton aria-label="delete item" onClick={handleDelete}>
  <DeleteIcon />
</IconButton>
```

### Focus Management
Use MUI's focus management utilities:

```javascript
import { Button } from '@mui/material';

<Button autoFocus>Primary Action</Button>
```

### Color Contrast
Ensure proper color contrast using theme colors:

```javascript
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      contrastText: '#ffffff',
    },
  },
});
```

## Performance Considerations

### Tree Shaking
Import components individually to enable tree shaking:

```javascript
// Preferred
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

// Avoid
import { Button, TextField } from '@mui/material';
```

### Bundle Size
Monitor bundle size when adding MUI components. Use bundle analyzers to track impact.

## Testing with MUI

### Component Testing
When testing MUI components, use appropriate selectors:

```javascript
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

function renderWithTheme(component) {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
}

test('renders button with correct text', () => {
  renderWithTheme(<Button>Click me</Button>);
  expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
});
```

## Migration Strategy

When migrating existing HTML/CSS components to MUI:

1. **Identify equivalent MUI components** for existing HTML elements
2. **Replace styling with theme-based approaches** instead of custom CSS
3. **Update tests** to work with MUI component structure
4. **Ensure accessibility** is maintained or improved

### Migration Example

Before (HTML/CSS):
```javascript
<div className="items-section">
  <table className="items-table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {items.map(item => (
        <tr key={item.id}>
          <td>{item.name}</td>
          <td>
            <button className="delete-btn" onClick={() => handleDelete(item.id)}>
              Delete
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

After (MUI):
```javascript
<Paper sx={{ p: 2 }}>
  <Typography variant="h6" gutterBottom>
    Items from Database
  </Typography>
  <TableContainer>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell align="center">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map(item => (
          <TableRow key={item.id} hover>
            <TableCell>{item.name}</TableCell>
            <TableCell align="center">
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => handleDelete(item.id)}
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
</Paper>
```

## Best Practices Summary

1. **Always use ThemeProvider** at the root of your application
2. **Prefer theme tokens** over hardcoded values
3. **Use sx prop** for component-specific styling
4. **Import components individually** for better tree shaking
5. **Follow Material Design principles** for consistent UX
6. **Test components** with proper theme context
7. **Maintain accessibility standards** with proper ARIA labels
8. **Use responsive design patterns** with MUI's breakpoint system
9. **Keep bundle size in check** by monitoring MUI imports
10. **Document custom theme extensions** for team consistency

## Resources

- [Material-UI Documentation](https://mui.com/)
- [Material Design Guidelines](https://material.io/design)
- [MUI Component Demos](https://mui.com/material-ui/getting-started/overview/)
- [MUI Theme Configuration](https://mui.com/material-ui/customization/theming/)
- [MUI System Properties](https://mui.com/system/properties/)
