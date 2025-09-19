import { test, expect, Page } from '@playwright/test';

// Test configuration
const ADMIN_EMAIL = 'admin@trendankara.com';
const ADMIN_PASSWORD = 'admin123';
const SUPER_ADMIN_EMAIL = 'superadmin@trendankara.com';
const SUPER_ADMIN_PASSWORD = 'superadmin123';

// Helper function to login as admin
async function loginAsAdmin(page: Page, email: string = ADMIN_EMAIL, password: string = ADMIN_PASSWORD) {
  await page.goto('/auth/signin');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/admin');
}

// Helper function to navigate to radio settings
async function navigateToRadioSettings(page: Page) {
  await page.goto('/admin/settings/radio');
  await page.waitForSelector('[data-testid="radio-settings-form"]', { timeout: 10000 });
}

// Helper function to wait for form submission
async function waitForFormSubmission(page: Page) {
  await page.waitForSelector('.loading', { state: 'hidden', timeout: 10000 });
}

test.describe('Radio Settings E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses for consistent testing
    await page.route('**/api/admin/settings/radio', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          json: {
            id: 1,
            stream_url: 'https://test.stream.com/radio',
            metadata_url: 'https://test.stream.com/metadata',
            station_name: 'Test Radio Station',
            station_description: 'Test Description',
            facebook_url: null,
            twitter_url: null,
            instagram_url: null,
            youtube_url: null,
            is_active: true
          }
        });
      }
    });

    await page.route('**/api/radio', async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            stream_url: 'https://test.stream.com/radio',
            metadata_url: 'https://test.stream.com/metadata',
            station_name: 'Test Radio Station',
            station_description: 'Test Description',
            is_active: true
          }
        }
      });
    });
  });

  test.describe('Access Control', () => {
    test('should require authentication to access radio settings', async ({ page }) => {
      await page.goto('/admin/settings/radio');
      await expect(page).toHaveURL(/\/auth\/signin/);
    });

    test('should allow admin users to access radio settings', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToRadioSettings(page);

      await expect(page.locator('h2')).toContainText('Radyo Ayarları');
      await expect(page.locator('input[name="stationName"]')).toBeVisible();
    });

    test('should restrict stream URL changes to super admin', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToRadioSettings(page);

      // Try to update stream URL as regular admin
      await page.route('**/api/admin/settings/radio', async (route) => {
        if (route.request().method() === 'PUT') {
          const body = await route.request().postDataJSON();
          if (body.streamUrl) {
            await route.fulfill({
              status: 403,
              json: {
                error: 'Super admin access required for stream URL modifications.'
              }
            });
          }
        }
      });

      await page.fill('input[name="streamUrl"]', 'https://new.stream.com/radio');
      await page.click('button[type="submit"]');

      await expect(page.locator('.error-message')).toContainText('Super admin access required');
    });
  });

  test.describe('Form Interactions', () => {
    test('should load current settings on page load', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToRadioSettings(page);

      await expect(page.locator('input[name="stationName"]')).toHaveValue('Test Radio Station');
      await expect(page.locator('textarea[name="description"]')).toHaveValue('Test Description');
      await expect(page.locator('input[name="streamUrl"]')).toHaveValue('https://test.stream.com/radio');
    });

    test('should validate required fields', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToRadioSettings(page);

      // Clear required field
      await page.fill('input[name="stationName"]', '');
      await page.click('button[type="submit"]');

      await expect(page.locator('.error-message')).toContainText('İstasyon adı gereklidir');
    });

    test('should validate URL formats', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToRadioSettings(page);

      // Enter invalid URL
      await page.fill('input[name="websiteUrl"]', 'invalid-url');
      await page.blur('input[name="websiteUrl"]');

      await expect(page.locator('.error-message')).toContainText('Geçerli bir URL girin');
    });

    test('should enable save button only when form has changes', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToRadioSettings(page);

      // Submit button should be disabled initially
      await expect(page.locator('button[type="submit"]')).toBeDisabled();

      // Make a change
      await page.fill('input[name="stationName"]', 'Updated Station Name');

      // Submit button should be enabled
      await expect(page.locator('button[type="submit"]')).toBeEnabled();
    });
  });

  test.describe('Stream Testing', () => {
    test('should test stream URL connectivity', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToRadioSettings(page);

      // Mock successful stream test
      await page.route('**/api/admin/settings/radio/test', async (route) => {
        await route.fulfill({
          json: {
            success: true,
            status: 'success',
            message: 'Stream connection successful',
            details: {
              statusCode: 200,
              responseTime: 150,
              contentType: 'audio/mpeg'
            }
          }
        });
      });

      await page.fill('input[name="streamUrl"]', 'https://test.stream.com/radio');
      await page.click('button:has-text("Stream URL Test Et")');

      await expect(page.locator('.test-result.success')).toContainText('Stream connection successful');
      await expect(page.locator('.test-details')).toContainText('Status Code: 200');
    });

    test('should handle failed stream test', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToRadioSettings(page);

      // Mock failed stream test
      await page.route('**/api/admin/settings/radio/test', async (route) => {
        await route.fulfill({
          json: {
            success: false,
            status: 'failure',
            message: 'Stream connection failed',
            error: 'Connection timeout'
          }
        });
      });

      await page.fill('input[name="streamUrl"]', 'https://invalid.stream.com/radio');
      await page.click('button:has-text("Stream URL Test Et")');

      await expect(page.locator('.test-result.error')).toContainText('Stream connection failed');
    });

    test('should handle rate limiting for stream tests', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToRadioSettings(page);

      // Mock rate limit response
      await page.route('**/api/admin/settings/radio/test', async (route) => {
        await route.fulfill({
          status: 429,
          json: {
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.',
            retryAfter: 60
          }
        });
      });

      await page.click('button:has-text("Stream URL Test Et")');

      await expect(page.locator('.error-message')).toContainText('Too many requests');
    });
  });

  test.describe('Settings Update Flow', () => {
    test('should successfully update radio settings', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToRadioSettings(page);

      // Mock successful update
      await page.route('**/api/admin/settings/radio', async (route) => {
        if (route.request().method() === 'PUT') {
          await route.fulfill({
            json: {
              id: 1,
              stream_url: 'https://test.stream.com/radio',
              station_name: 'Updated Station Name',
              station_description: 'Updated Description',
              is_active: true
            }
          });
        }
      });

      // Update form fields
      await page.fill('input[name="stationName"]', 'Updated Station Name');
      await page.fill('textarea[name="description"]', 'Updated Description');
      await page.click('button[type="submit"]');

      await waitForFormSubmission(page);

      // Should show success message
      await expect(page.locator('.success-message')).toContainText('Ayarlar başarıyla güncellendi');
    });

    test('should trigger radio player reconnection after settings update', async ({ page }) => {
      await loginAsAdmin(page);

      // Open a second tab with radio player
      const playerPage = await page.context().newPage();
      await playerPage.goto('/');

      // Wait for radio player to load
      await playerPage.waitForSelector('[data-testid="radio-player"]');

      // Listen for the settings update event
      await playerPage.addInitScript(() => {
        window.settingsUpdateReceived = false;
        window.addEventListener('radioSettingsUpdated', () => {
          window.settingsUpdateReceived = true;
        });
      });

      // Go back to settings page and update
      await navigateToRadioSettings(page);

      await page.route('**/api/admin/settings/radio', async (route) => {
        if (route.request().method() === 'PUT') {
          await route.fulfill({
            json: {
              id: 1,
              stream_url: 'https://new.stream.com/radio',
              station_name: 'Updated Station',
              is_active: true
            }
          });
        }
      });

      await page.fill('input[name="stationName"]', 'Updated Station');
      await page.click('button[type="submit"]');

      await waitForFormSubmission(page);

      // Check if event was dispatched
      const eventReceived = await playerPage.evaluate(() => window.settingsUpdateReceived);
      expect(eventReceived).toBe(true);

      await playerPage.close();
    });

    test('should handle update errors gracefully', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToRadioSettings(page);

      // Mock update error
      await page.route('**/api/admin/settings/radio', async (route) => {
        if (route.request().method() === 'PUT') {
          await route.fulfill({
            status: 500,
            json: {
              error: 'Internal server error'
            }
          });
        }
      });

      await page.fill('input[name="stationName"]', 'Updated Station Name');
      await page.click('button[type="submit"]');

      await expect(page.locator('.error-message')).toContainText('Ayarlar kaydedilirken bir hata oluştu');
    });
  });

  test.describe('Super Admin Features', () => {
    test('should allow super admin to update stream URLs', async ({ page }) => {
      await loginAsAdmin(page, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD);
      await navigateToRadioSettings(page);

      // Mock successful stream URL update
      await page.route('**/api/admin/settings/radio', async (route) => {
        if (route.request().method() === 'PUT') {
          await route.fulfill({
            json: {
              id: 1,
              stream_url: 'https://new.stream.com/radio',
              station_name: 'Test Radio Station',
              is_active: true
            }
          });
        }
      });

      await page.fill('input[name="streamUrl"]', 'https://new.stream.com/radio');
      await page.click('button[type="submit"]');

      await waitForFormSubmission(page);

      await expect(page.locator('.success-message')).toBeVisible();
    });
  });

  test.describe('Fallback Mechanisms', () => {
    test('should handle player reconnection with new stream URL', async ({ page }) => {
      await page.goto('/');

      // Wait for initial radio config load
      await page.waitForSelector('[data-testid="radio-player"]');

      // Mock updated radio config with new stream URL
      await page.route('**/api/radio', async (route) => {
        await route.fulfill({
          json: {
            success: true,
            data: {
              stream_url: 'https://fallback.stream.com/radio',
              station_name: 'Test Radio Station',
              is_fallback_url: true
            }
          }
        });
      });

      // Trigger configuration reload
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('radioSettingsUpdated'));
      });

      // Wait for player to show buffering state
      await expect(page.locator('[data-testid="radio-player"] .buffering')).toBeVisible();
    });

    test('should display fallback indicator when using backup stream', async ({ page }) => {
      await page.route('**/api/radio', async (route) => {
        await route.fulfill({
          json: {
            success: true,
            data: {
              stream_url: 'https://fallback.stream.com/radio',
              station_name: 'Test Radio Station',
              is_fallback_url: true
            }
          }
        });
      });

      await page.goto('/');
      await page.waitForSelector('[data-testid="radio-player"]');

      // Should indicate fallback is being used
      await expect(page.locator('.fallback-indicator')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToRadioSettings(page);

      // Tab through form fields
      await page.keyboard.press('Tab');
      await expect(page.locator('input[name="stationName"]')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('textarea[name="description"]')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('input[name="streamUrl"]')).toBeFocused();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToRadioSettings(page);

      await expect(page.locator('input[name="stationName"]')).toHaveAttribute('aria-label');
      await expect(page.locator('button[type="submit"]')).toHaveAttribute('aria-label');
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await loginAsAdmin(page);
      await navigateToRadioSettings(page);

      // Form should be visible and usable on mobile
      await expect(page.locator('[data-testid="radio-settings-form"]')).toBeVisible();
      await expect(page.locator('input[name="stationName"]')).toBeVisible();
    });
  });
});