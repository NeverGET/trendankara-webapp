/**
 * E2E Tests for ReUI Migration Critical Paths
 *
 * These tests verify critical user journeys work correctly
 * with the migrated ReUI components.
 */

// Note: This is a test specification file for Playwright/Cypress
// Actual implementation would require test runner setup

describe('ReUI Migration E2E Tests', () => {
  beforeEach(() => {
    // Set feature flag to use ReUI components
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('NEXT_PUBLIC_USE_REUI', 'true');
      },
    });
  });

  describe('Critical Path: User Authentication', () => {
    it('should allow user to sign in with ReUI components', () => {
      // Navigate to sign-in page
      cy.visit('/auth/sign-in');

      // Check that ReUI components are rendered
      cy.get('input[name="email"]').should('have.class', 'border-input');
      cy.get('button[type="submit"]').should('exist');

      // Fill in form using ReUI Input components
      cy.get('input[name="email"]').type('admin@trendankara.com');
      cy.get('input[name="password"]').type('testpassword123');

      // Submit using ReUI Button
      cy.get('button[type="submit"]').click();

      // Verify redirect to admin dashboard
      cy.url().should('include', '/admin');
    });

    it('should display validation errors with ReUI Alert', () => {
      cy.visit('/auth/sign-in');

      // Submit empty form
      cy.get('button[type="submit"]').click();

      // Check for ReUI error styling
      cy.get('input[name="email"]').should('have.class', 'border-red-600');
      cy.get('.text-red-600').should('contain', 'Email is required');
    });
  });

  describe('Critical Path: Admin Dashboard', () => {
    beforeEach(() => {
      // Mock authentication
      cy.login('admin@trendankara.com', 'password');
      cy.visit('/admin');
    });

    it('should display dashboard cards with ReUI Card component', () => {
      // Check for ReUI Card components
      cy.get('.bg-dark-surface-primary').should('have.length.greaterThan', 0);

      // Verify gradient cards
      cy.get('.bg-gradient-to-br').should('exist');

      // Check card hover effects
      cy.get('.hover\\:shadow-lg').first().trigger('mouseenter');
    });

    it('should navigate using ReUI navigation components', () => {
      // Test sidebar navigation
      cy.get('nav').within(() => {
        cy.contains('News').click();
      });
      cy.url().should('include', '/admin/news');

      // Test breadcrumb navigation
      cy.get('[aria-label="breadcrumb"]').should('exist');
    });
  });

  describe('Critical Path: Content Management', () => {
    beforeEach(() => {
      cy.login('admin@trendankara.com', 'password');
      cy.visit('/admin/news');
    });

    it('should create news article with ReUI form components', () => {
      // Click create button (ReUI Button)
      cy.get('button').contains('Create News').click();

      // Fill form with ReUI components
      cy.get('input[name="title"]').type('Test Article');
      cy.get('textarea[name="content"]').type('This is test content');

      // Select category using ReUI Select
      cy.get('[role="combobox"]').click();
      cy.get('[role="option"]').contains('Technology').click();

      // Toggle featured using ReUI Checkbox
      cy.get('input[type="checkbox"][name="featured"]').check();

      // Submit form
      cy.get('button[type="submit"]').contains('Save').click();

      // Verify success toast (ReUI Toast)
      cy.get('.sonner-toast').should('contain', 'News article created');
    });

    it('should display data in ReUI Table with sorting', () => {
      // Check table is rendered
      cy.get('table').should('exist');

      // Test sorting functionality
      cy.get('th').contains('Title').click();
      cy.get('[data-testid="sort-icon-asc"]').should('exist');

      // Click again for descending
      cy.get('th').contains('Title').click();
      cy.get('[data-testid="sort-icon-desc"]').should('exist');
    });

    it('should handle pagination with ReUI components', () => {
      // Check pagination controls
      cy.get('[aria-label="Go to next page"]').should('exist');

      // Navigate to page 2
      cy.get('button').contains('2').click();

      // Verify URL updated
      cy.url().should('include', 'page=2');
    });
  });

  describe('Critical Path: Media Management', () => {
    beforeEach(() => {
      cy.login('admin@trendankara.com', 'password');
      cy.visit('/admin/media');
    });

    it('should upload media with ReUI Progress component', () => {
      // Open upload dialog
      cy.get('button').contains('Upload').click();

      // Select file
      cy.get('input[type="file"]').selectFile('test-image.jpg');

      // Check progress bar appears
      cy.get('[role="progressbar"]').should('exist');
      cy.get('.text-sm').should('contain', '%');

      // Verify upload complete
      cy.get('.text-green-600').should('contain', 'Upload complete');
    });

    it('should filter media with ReUI Select and Input', () => {
      // Filter by type using ReUI Select
      cy.get('[role="combobox"]').first().click();
      cy.get('[role="option"]').contains('Images').click();

      // Search using ReUI Input
      cy.get('input[placeholder="Search media..."]').type('banner');

      // Verify filtered results
      cy.get('.grid').within(() => {
        cy.get('[data-media-type="image"]').should('exist');
      });
    });
  });

  describe('Critical Path: Poll Management', () => {
    beforeEach(() => {
      cy.login('admin@trendankara.com', 'password');
      cy.visit('/admin/polls');
    });

    it('should create poll with ReUI components', () => {
      // Open create dialog (ReUI Dialog)
      cy.get('button').contains('Create Poll').click();

      // Fill poll details
      cy.get('input[name="question"]').type('What is your favorite feature?');

      // Add options
      cy.get('button').contains('Add Option').click();
      cy.get('input[name="option-1"]').type('Dark Theme');

      cy.get('button').contains('Add Option').click();
      cy.get('input[name="option-2"]').type('New Components');

      // Set active using ReUI Checkbox
      cy.get('input[name="active"]').check();

      // Save poll
      cy.get('button').contains('Create').click();

      // Verify success
      cy.get('[role="alert"]').should('contain', 'Poll created successfully');
    });

    it('should display poll results with ReUI Progress bars', () => {
      // Click on existing poll
      cy.get('[data-poll-id="1"]').click();

      // Check progress bars for results
      cy.get('[role="progressbar"]').should('have.length.greaterThan', 0);

      // Verify percentages displayed
      cy.get('.text-sm').contains('%').should('exist');
    });
  });

  describe('Critical Path: Settings Management', () => {
    beforeEach(() => {
      cy.login('admin@trendankara.com', 'password');
      cy.visit('/admin/settings');
    });

    it('should update settings with ReUI form components', () => {
      // Navigate to radio settings
      cy.get('button').contains('Radio Settings').click();

      // Update stream URL using ReUI Input
      cy.get('input[name="streamUrl"]').clear().type('https://newstream.example.com');

      // Toggle metadata using ReUI Checkbox
      cy.get('input[name="enableMetadata"]').uncheck();

      // Save settings using ReUI Button
      cy.get('button[type="submit"]').contains('Save').click();

      // Verify success alert
      cy.get('[role="alert"].border-green-600').should('contain', 'Settings saved');
    });
  });

  describe('Critical Path: Mobile Responsiveness', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
      cy.login('admin@trendankara.com', 'password');
    });

    it('should display responsive table on mobile', () => {
      cy.visit('/admin/news');

      // Check table switches to card view on mobile
      cy.get('.md\\:hidden').should('exist');
      cy.get('table.hidden.md\\:table').should('exist');

      // Verify cards are displayed
      cy.get('[data-mobile-card]').should('have.length.greaterThan', 0);
    });

    it('should show mobile-optimized navigation', () => {
      cy.visit('/admin');

      // Open mobile menu
      cy.get('[aria-label="Open menu"]').click();

      // Check sidebar slides in
      cy.get('nav').should('be.visible');

      // Navigate using mobile menu
      cy.get('nav').contains('Polls').click();
      cy.url().should('include', '/admin/polls');
    });

    it('should handle form inputs on mobile', () => {
      cy.visit('/admin/news/create');

      // Check inputs are full width on mobile
      cy.get('input[name="title"]').should('have.class', 'w-full');

      // Test textarea auto-resize
      const longText = 'Lorem ipsum '.repeat(50);
      cy.get('textarea[name="content"]').type(longText);

      // Verify textarea expanded
      cy.get('textarea[name="content"]').invoke('height').should('be.greaterThan', 100);
    });
  });

  describe('Critical Path: Dark Theme Validation', () => {
    it('should maintain dark theme across all pages', () => {
      const pagesToTest = [
        '/admin',
        '/admin/news',
        '/admin/polls',
        '/admin/media',
        '/admin/settings',
      ];

      pagesToTest.forEach(page => {
        cy.visit(page);

        // Check background is black
        cy.get('body').should('have.class', 'bg-dark-bg-primary');

        // Check text is white
        cy.get('body').should('have.class', 'text-dark-text-primary');

        // Check primary color is red
        cy.get('.bg-primary').should('have.css', 'background-color')
          .and('include', 'rgb('); // Red color in RGB
      });
    });
  });

  describe('Critical Path: Error Handling', () => {
    it('should display error states with ReUI Alert', () => {
      // Simulate API error
      cy.intercept('GET', '/api/news', { statusCode: 500 });

      cy.visit('/admin/news');

      // Check error alert is displayed
      cy.get('[role="alert"].border-red-600').should('exist');
      cy.get('[role="alert"]').should('contain', 'Failed to load news');

      // Test retry with ReUI Button
      cy.get('button').contains('Retry').click();
    });

    it('should handle form validation errors', () => {
      cy.visit('/admin/news/create');

      // Submit empty form
      cy.get('button[type="submit"]').click();

      // Check all required fields show errors
      cy.get('.border-red-600').should('have.length.greaterThan', 0);
      cy.get('.text-red-600').should('contain', 'required');
    });
  });

  describe('Performance Tests', () => {
    it('should load dashboard within acceptable time', () => {
      cy.visit('/admin', {
        onBeforeLoad(win) {
          win.performance.mark('start');
        },
        onLoad(win) {
          win.performance.mark('end');
          win.performance.measure('pageLoad', 'start', 'end');
          const measure = win.performance.getEntriesByName('pageLoad')[0];

          // Page should load within 3 seconds
          expect(measure.duration).to.be.lessThan(3000);
        },
      });
    });

    it('should handle rapid component interactions', () => {
      cy.visit('/admin/news');

      // Rapidly click sorting headers
      for (let i = 0; i < 10; i++) {
        cy.get('th').contains('Title').click();
      }

      // Should not crash or show errors
      cy.get('[role="alert"].border-red-600').should('not.exist');
    });
  });
});

// Helper commands
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/auth/sign-in');
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/admin');
  });
});