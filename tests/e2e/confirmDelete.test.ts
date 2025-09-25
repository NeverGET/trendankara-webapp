import { test, expect, Page } from '@playwright/test';

// Test configuration
const ADMIN_EMAIL = 'admin@trendankara.com';
const ADMIN_PASSWORD = 'admin123';

// Helper function to login as admin
async function loginAsAdmin(page: Page) {
  await page.goto('/auth/signin');
  await page.fill('input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('/admin');
}

// Helper function to setup mock data
async function setupMockData(page: Page) {
  // Mock news data
  await page.route('**/api/admin/news*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        json: {
          success: true,
          data: [
            {
              id: 1,
              title: 'Test News Article 1',
              slug: 'test-news-article-1',
              content: 'Test content 1',
              is_active: true,
              created_at: '2024-01-01T00:00:00Z'
            },
            {
              id: 2,
              title: 'Test News Article 2',
              slug: 'test-news-article-2',
              content: 'Test content 2',
              is_active: true,
              created_at: '2024-01-02T00:00:00Z'
            }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        }
      });
    }
  });

  // Mock polls data
  await page.route('**/api/admin/polls*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        json: {
          success: true,
          data: [
            {
              id: 1,
              title: 'Test Poll 1',
              description: 'Test poll description 1',
              is_active: true,
              created_at: '2024-01-01T00:00:00Z'
            },
            {
              id: 2,
              title: 'Test Poll 2',
              description: 'Test poll description 2',
              is_active: false,
              created_at: '2024-01-02T00:00:00Z'
            }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        }
      });
    }
  });

  // Mock media data
  await page.route('**/api/admin/media*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        json: {
          success: true,
          data: [
            {
              id: 1,
              filename: 'test-image-1.jpg',
              original_name: 'test-image-1.jpg',
              url: 'https://example.com/test-image-1.jpg',
              size: 1024000,
              created_at: '2024-01-01T00:00:00Z'
            },
            {
              id: 2,
              filename: 'test-image-2.jpg',
              original_name: 'test-image-2.jpg',
              url: 'https://example.com/test-image-2.jpg',
              size: 2048000,
              created_at: '2024-01-02T00:00:00Z'
            }
          ]
        }
      });
    }
  });
}

test.describe('Deletion with Confirmation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockData(page);
  });

  test.describe('News Deletion', () => {
    test('should show confirmation dialog when deleting news article', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/news');

      // Wait for news list to load
      await page.waitForSelector('[data-testid="news-list"]');

      // Click delete button for first news article
      await page.click('[data-testid="delete-news-1"]');

      // Confirmation dialog should appear
      await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();
      await expect(page.locator('[data-testid="confirm-dialog"] h3')).toContainText('Haber Sil');
      await expect(page.locator('[data-testid="confirm-dialog"] p')).toContainText('Test News Article 1');
      await expect(page.locator('button:has-text("Sil")')).toBeVisible();
      await expect(page.locator('button:has-text("İptal")')).toBeVisible();
    });

    test('should cancel deletion when cancel button is clicked', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/news');

      await page.waitForSelector('[data-testid="news-list"]');
      await page.click('[data-testid="delete-news-1"]');

      // Wait for confirmation dialog
      await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();

      // Click cancel
      await page.click('button:has-text("İptal")');

      // Dialog should close
      await expect(page.locator('[data-testid="confirm-dialog"]')).not.toBeVisible();

      // News item should still be in the list
      await expect(page.locator('text=Test News Article 1')).toBeVisible();
    });

    test('should delete news when confirmed', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/news');

      // Mock successful deletion
      await page.route('**/api/admin/news?id=1', async (route) => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({
            json: {
              success: true,
              message: 'News article deleted successfully'
            }
          });
        }
      });

      await page.waitForSelector('[data-testid="news-list"]');
      await page.click('[data-testid="delete-news-1"]');

      // Wait for confirmation dialog
      await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();

      // Click confirm
      await page.click('button:has-text("Sil")');

      // Dialog should close
      await expect(page.locator('[data-testid="confirm-dialog"]')).not.toBeVisible();

      // Success message should appear
      await expect(page.locator('.success-message')).toContainText('Haber başarıyla silindi');
    });

    test('should handle deletion errors with retry option', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/news');

      let attemptCount = 0;

      // Mock failed deletion on first attempt, success on retry
      await page.route('**/api/admin/news?id=1', async (route) => {
        if (route.request().method() === 'DELETE') {
          attemptCount++;
          if (attemptCount === 1) {
            await route.fulfill({
              status: 500,
              json: {
                success: false,
                error: 'Network error occurred'
              }
            });
          } else {
            await route.fulfill({
              json: {
                success: true,
                message: 'News article deleted successfully'
              }
            });
          }
        }
      });

      await page.waitForSelector('[data-testid="news-list"]');
      await page.click('[data-testid="delete-news-1"]');

      // Confirm deletion
      await page.click('button:has-text("Sil")');

      // Error should be displayed
      await expect(page.locator('.error-message')).toContainText('Network error occurred');

      // Retry button should be visible
      await expect(page.locator('button:has-text("Tekrar Dene")')).toBeVisible();

      // Click retry
      await page.click('button:has-text("Tekrar Dene")');

      // Should succeed on retry
      await expect(page.locator('.success-message')).toContainText('Haber başarıyla silindi');
    });

    test('should show loading state during deletion', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/news');

      // Mock slow deletion response
      await page.route('**/api/admin/news?id=1', async (route) => {
        if (route.request().method() === 'DELETE') {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await route.fulfill({
            json: {
              success: true,
              message: 'News article deleted successfully'
            }
          });
        }
      });

      await page.waitForSelector('[data-testid="news-list"]');
      await page.click('[data-testid="delete-news-1"]');

      // Confirm deletion
      await page.click('button:has-text("Sil")');

      // Loading state should be visible
      await expect(page.locator('[data-testid="confirm-dialog"] .loading')).toBeVisible();
      await expect(page.locator('button:has-text("Sil")')).toBeDisabled();
      await expect(page.locator('button:has-text("İptal")')).toBeDisabled();
    });
  });

  test.describe('Poll Deletion', () => {
    test('should show confirmation dialog when deleting poll', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/polls');

      await page.waitForSelector('[data-testid="polls-list"]');
      await page.click('[data-testid="delete-poll-1"]');

      // Confirmation dialog should appear
      await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();
      await expect(page.locator('[data-testid="confirm-dialog"] h3')).toContainText('Anket Sil');
      await expect(page.locator('[data-testid="confirm-dialog"] p')).toContainText('Test Poll 1');
    });

    test('should handle poll deletion with vote data warning', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/polls');

      await page.waitForSelector('[data-testid="polls-list"]');
      await page.click('[data-testid="delete-poll-1"]');

      // Should warn about vote data
      await expect(page.locator('[data-testid="confirm-dialog"] .warning')).toContainText(
        'Bu anketin oy verileri de silinecektir'
      );
    });
  });

  test.describe('Media Deletion', () => {
    test('should show confirmation dialog when deleting media', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/media');

      await page.waitForSelector('[data-testid="media-list"]');
      await page.click('[data-testid="delete-media-1"]');

      // Confirmation dialog should appear
      await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();
      await expect(page.locator('[data-testid="confirm-dialog"] h3')).toContainText('Medya Sil');

      // Should show media preview in confirmation
      await expect(page.locator('[data-testid="media-preview"]')).toBeVisible();
      await expect(page.locator('[data-testid="media-preview"] img')).toHaveAttribute(
        'src',
        'https://example.com/test-image-1.jpg'
      );
    });

    test('should handle media deletion with usage warning', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/media');

      // Mock media with usage information
      await page.route('**/api/admin/media/1/usage', async (route) => {
        await route.fulfill({
          json: {
            usedIn: [
              { type: 'news', id: 1, title: 'Test News Article 1' },
              { type: 'news', id: 2, title: 'Test News Article 2' }
            ]
          }
        });
      });

      await page.waitForSelector('[data-testid="media-list"]');
      await page.click('[data-testid="delete-media-1"]');

      // Should warn about usage
      await expect(page.locator('[data-testid="confirm-dialog"] .warning')).toContainText(
        'Bu medya 2 içerikte kullanılıyor'
      );
    });
  });

  test.describe('Batch Deletion', () => {
    test('should show batch confirmation for multiple items', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/news');

      await page.waitForSelector('[data-testid="news-list"]');

      // Select multiple items
      await page.check('[data-testid="select-news-1"]');
      await page.check('[data-testid="select-news-2"]');

      // Click batch delete
      await page.click('[data-testid="batch-delete"]');

      // Confirmation dialog should show item count
      await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();
      await expect(page.locator('[data-testid="confirm-dialog"] p')).toContainText(
        '2 öğeyi silmek istediğinizden emin misiniz?'
      );
    });

    test('should handle batch deletion with mixed success/failure', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/news');

      // Mock mixed batch deletion results
      await page.route('**/api/admin/news/batch', async (route) => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({
            json: {
              success: true,
              results: [
                { id: 1, success: true },
                { id: 2, success: false, error: 'Cannot delete published article' }
              ]
            }
          });
        }
      });

      await page.waitForSelector('[data-testid="news-list"]');
      await page.check('[data-testid="select-news-1"]');
      await page.check('[data-testid="select-news-2"]');
      await page.click('[data-testid="batch-delete"]');

      // Confirm batch deletion
      await page.click('button:has-text("Sil")');

      // Should show mixed results
      await expect(page.locator('.batch-results')).toContainText('1 öğe başarıyla silindi');
      await expect(page.locator('.batch-results')).toContainText('1 öğe silinemedi');
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should handle keyboard navigation in confirmation dialog', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/news');

      await page.waitForSelector('[data-testid="news-list"]');
      await page.click('[data-testid="delete-news-1"]');

      // Wait for dialog
      await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();

      // Tab should cycle through buttons
      await page.keyboard.press('Tab');
      await expect(page.locator('button:has-text("İptal")')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('button:has-text("Sil")')).toBeFocused();

      // Escape should close dialog
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="confirm-dialog"]')).not.toBeVisible();
    });

    test('should handle Enter and Space key confirmation', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/news');

      await page.route('**/api/admin/news?id=1', async (route) => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({
            json: { success: true, message: 'Deleted successfully' }
          });
        }
      });

      await page.waitForSelector('[data-testid="news-list"]');
      await page.click('[data-testid="delete-news-1"]');

      await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();

      // Navigate to confirm button and press Enter
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');

      await expect(page.locator('[data-testid="confirm-dialog"]')).not.toBeVisible();
      await expect(page.locator('.success-message')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA attributes', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/news');

      await page.waitForSelector('[data-testid="news-list"]');
      await page.click('[data-testid="delete-news-1"]');

      const dialog = page.locator('[data-testid="confirm-dialog"]');
      await expect(dialog).toHaveAttribute('role', 'dialog');
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
      await expect(dialog).toHaveAttribute('aria-labelledby');
    });

    test('should announce deletion results to screen readers', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/news');

      await page.route('**/api/admin/news?id=1', async (route) => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({
            json: { success: true, message: 'News deleted successfully' }
          });
        }
      });

      await page.waitForSelector('[data-testid="news-list"]');
      await page.click('[data-testid="delete-news-1"]');
      await page.click('button:has-text("Sil")');

      // Success message should have proper ARIA attributes
      const successMessage = page.locator('.success-message');
      await expect(successMessage).toHaveAttribute('role', 'status');
      await expect(successMessage).toHaveAttribute('aria-live', 'polite');
    });
  });

  test.describe('Error Recovery', () => {
    test('should handle network errors during deletion', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/news');

      // Mock network error
      await page.route('**/api/admin/news?id=1', async (route) => {
        await route.abort('failed');
      });

      await page.waitForSelector('[data-testid="news-list"]');
      await page.click('[data-testid="delete-news-1"]');
      await page.click('button:has-text("Sil")');

      await expect(page.locator('.error-message')).toContainText('Ağ hatası oluştu');
      await expect(page.locator('button:has-text("Tekrar Dene")')).toBeVisible();
    });

    test('should recover from timeout errors', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/news');

      // Mock timeout
      await page.route('**/api/admin/news?id=1', async (route) => {
        await new Promise(() => {}); // Never resolve
      });

      await page.waitForSelector('[data-testid="news-list"]');
      await page.click('[data-testid="delete-news-1"]');
      await page.click('button:has-text("Sil")');

      // Should eventually timeout and show error
      await expect(page.locator('.error-message')).toContainText('İşlem zaman aşımına uğradı', {
        timeout: 15000
      });
    });
  });

  test.describe('Visual Feedback', () => {
    test('should show appropriate icons for different variants', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/news');

      await page.waitForSelector('[data-testid="news-list"]');
      await page.click('[data-testid="delete-news-1"]');

      // Should show danger variant icon
      await expect(page.locator('[data-testid="confirm-dialog"] .danger-icon')).toBeVisible();
    });

    test('should show deletion count badge for batch operations', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/news');

      await page.waitForSelector('[data-testid="news-list"]');
      await page.check('[data-testid="select-news-1"]');
      await page.check('[data-testid="select-news-2"]');

      // Batch delete button should show count
      await expect(page.locator('[data-testid="batch-delete"] .count-badge')).toContainText('2');
    });
  });
});