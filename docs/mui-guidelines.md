# Material-UI (MUI) Guidelines

This document outlines the guidelines and best practices for using Material-UI (MUI) components in the frontend application.

## Overview

Material-UI (MUI) is a comprehensive React component library that implements Google's Material Design. It provides pre-built components, theming capabilities, and consistent styling across the application.

## Installation and Setup

### Dependencies
The following MUI packages should be installed:
- `@mui/material` - Core MUI components
- `@mui/icons-material` - Material Design icons
- `@emotion/react` - Required peer dependency for styling
- `@emotion/styled` - Required peer dependency for styling

### Theme Configuration
Create a consistent theme configuration that defines:
- Color palette (primary, secondary, error, warning, info, success)
- Typography scale and font families
- Spacing system
- Breakpoints for responsive design
- Component variants and overrides

## Component Usage Guidelines

### Layout Components
- Use `Container` for consistent page-level spacing and max-width
- Use `Grid` system for responsive layouts
- Use `Box` for flexible spacing and layout utilities
- Use `Stack` for simple vertical or horizontal layouts

### Navigation Components
- Use `AppBar` with `Toolbar` for top navigation
- Use `Drawer` for side navigation menus
- Use `Breadcrumbs` for hierarchical navigation
- Use `BottomNavigation` for mobile-friendly bottom navigation

### Input Components
- Use `TextField` for all text inputs with consistent styling
- Use `Select` and `MenuItem` for dropdown selections
- Use `Autocomplete` for searchable dropdowns
- Use `Checkbox`, `Radio`, and `Switch` for boolean inputs
- Use `Slider` for range inputs
- Always include proper `label` attributes for accessibility

### Display Components
- Use `Typography` component instead of raw HTML text elements
- Use `Card` with `CardContent` for content grouping
- Use `List` with `ListItem` for structured data display
- Use `Table` components for tabular data
- Use `Chip` for tags and status indicators

### Feedback Components
- Use `Alert` for user notifications and messages
- Use `Snackbar` for temporary notifications
- Use `Dialog` for modal interactions
- Use `Tooltip` for additional information
- Use `LinearProgress` or `CircularProgress` for loading states

### Action Components
- Use `Button` with appropriate variants (contained, outlined, text)
- Use `IconButton` for icon-only actions
- Use `Fab` (Floating Action Button) for primary actions
- Use `ButtonGroup` for related actions

## Styling Best Practices

### Theme Usage
- Always use theme values instead of hardcoded styles
- Access theme values through the `useTheme` hook or `sx` prop
- Use theme spacing units (`theme.spacing()`) for consistent spacing
- Use theme breakpoints for responsive design

### Component Styling
- Prefer the `sx` prop for component-specific styling
- Use `styled()` function for reusable styled components
- Avoid inline styles unless absolutely necessary
- Use theme variants for consistent component appearances

### Responsive Design
- Use MUI's Grid system for responsive layouts
- Utilize theme breakpoints in styling
- Test components across different screen sizes
- Consider mobile-first design approach

## Accessibility Guidelines

### Keyboard Navigation
- Ensure all interactive elements are keyboard accessible
- Use proper focus management in modals and dialogs
- Implement logical tab order

### Screen Reader Support
- Use semantic HTML elements when possible
- Provide proper ARIA labels and descriptions
- Use MUI's built-in accessibility features
- Test with screen readers

### Color and Contrast
- Ensure sufficient color contrast ratios
- Don't rely solely on color to convey information
- Use theme colors that meet accessibility standards

## Performance Considerations

### Bundle Size
- Import only the components you need
- Use tree-shaking to eliminate unused code
- Consider using `@mui/material/styles` for theme-related imports

### Component Optimization
- Use `React.memo()` for expensive components
- Implement proper key props for lists
- Avoid unnecessary re-renders with proper dependency management

## Common Patterns

### Form Handling
```javascript
import { TextField, Button, Box } from '@mui/material';
import { useFormik } from 'formik';

const MyForm = () => {
  const formik = useFormik({
    initialValues: { name: '', email: '' },
    onSubmit: (values) => {
      // Handle form submission
    },
  });

  return (
    <Box component="form" onSubmit={formik.handleSubmit}>
      <TextField
        name="name"
        label="Name"
        value={formik.values.name}
        onChange={formik.handleChange}
        fullWidth
        margin="normal"
      />
      <Button type="submit" variant="contained">
        Submit
      </Button>
    </Box>
  );
};
```

### Loading States
```javascript
import { Button, CircularProgress } from '@mui/material';

const LoadingButton = ({ loading, children, ...props }) => (
  <Button
    {...props}
    disabled={loading}
    startIcon={loading ? <CircularProgress size={20} /> : null}
  >
    {loading ? 'Loading...' : children}
  </Button>
);
```

### Responsive Layout
```javascript
import { Grid, Container } from '@mui/material';

const ResponsiveLayout = () => (
  <Container maxWidth="lg">
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <MainContent />
      </Grid>
      <Grid item xs={12} md={4}>
        <Sidebar />
      </Grid>
    </Grid>
  </Container>
);
```

## Error Handling

### Form Validation
- Use MUI's built-in error states for form fields
- Display error messages clearly and consistently
- Provide helpful validation feedback

### User Feedback
- Use consistent error messaging patterns
- Implement proper error boundaries
- Provide clear recovery actions

## Testing with MUI

### Component Testing
- Use `@testing-library/react` for component testing
- Test accessibility features
- Mock theme provider in tests
- Test responsive behavior

### Best Practices
- Test user interactions, not implementation details
- Use semantic queries when possible
- Test keyboard navigation
- Verify proper ARIA attributes

## Migration and Updates

### Version Updates
- Follow MUI's migration guides for version updates
- Test thoroughly after updates
- Update custom theme configurations as needed

### Component Deprecation
- Stay informed about deprecated components
- Plan migration strategies for deprecated features
- Use codemods when available for automated migration

## Resources

### Documentation
- [MUI Official Documentation](https://mui.com/)
- [Material Design Guidelines](https://material.io/design)
- [MUI Component Demos](https://mui.com/components/)

### Tools
- [MUI Theme Creator](https://mui.com/customization/theming/)
- [MUI Design Kits](https://mui.com/design-kits/)
- [MUI Templates](https://mui.com/templates/)

## Common Pitfalls to Avoid

1. **Overriding default styles unnecessarily** - Use theme customization instead
2. **Inconsistent spacing** - Always use theme spacing units
3. **Ignoring accessibility** - Test with keyboard navigation and screen readers
4. **Poor responsive design** - Test on various screen sizes
5. **Bundle size issues** - Import only what you need
6. **Theme inconsistencies** - Use theme values throughout the application
7. **Mixing styling approaches** - Choose one approach (sx, styled, or emotion) and stick with it
8. **Not following Material Design principles** - Understand the design system behind MUI

By following these guidelines, you'll create a consistent, accessible, and maintainable user interface that leverages the full power of Material-UI while adhering to best practices.
