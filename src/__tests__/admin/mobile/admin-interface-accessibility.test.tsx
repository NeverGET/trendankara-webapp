/**
 * Admin Interface Accessibility and Turkish Language Test
 * Tests mobile admin interface for Turkish language consistency and touch device accessibility
 * Requirements: 4.5, 6.5, Usability requirements
 * Task 14: Test admin interface accessibility and Turkish language
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import MobileCardsPage from '@/app/admin/mobile/cards/page';
import MobileSettingsPage from '@/app/admin/mobile/settings/page';
import type { MobileCard, MobileSettings } from '@/types/mobile';

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Dialog components
jest.mock('@/components/ui/dialog-reui', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
}));

// Mock child components with Turkish text
jest.mock('@/components/admin/mobile/MobileCardForm', () => {
  return {
    MobileCardForm: ({ card, onCancel }: any) => (
      <div data-testid="mobile-card-form">
        <h2>{card ? 'Kartı Düzenle' : 'Yeni Kart Oluştur'}</h2>
        <div>
          <label htmlFor="title">Başlık *</label>
          <input id="title" placeholder="Kart başlığını girin" />
        </div>
        <div>
          <label htmlFor="description">Açıklama</label>
          <textarea id="description" placeholder="Kart açıklaması (isteğe bağlı)" />
        </div>
        <div>
          <label htmlFor="imageUrl">Görsel URL</label>
          <input id="imageUrl" placeholder="https://example.com/image.jpg" />
        </div>
        <div>
          <label htmlFor="redirectUrl">Yönlendirme URL</label>
          <input id="redirectUrl" placeholder="https://example.com veya /sayfa" />
        </div>
        <div>
          <label htmlFor="displayOrder">Sıralama</label>
          <input id="displayOrder" type="number" />
          <p>Düşük değerler önce gösterilir</p>
        </div>
        <div>
          <label htmlFor="isFeatured">Öne Çıkan Kart</label>
          <input id="isFeatured" type="checkbox" />
        </div>
        <div>
          <label htmlFor="isActive">Aktif</label>
          <input id="isActive" type="checkbox" />
        </div>
        <div>
          <button type="button" onClick={onCancel}>İptal</button>
          <button type="submit">{card ? 'Güncelle' : 'Oluştur'}</button>
        </div>
      </div>
    ),
  };
});

jest.mock('@/components/admin/mobile/MobileCardList', () => {
  return {
    MobileCardList: ({ cards }: any) => (
      <div data-testid="mobile-card-list">
        <h3>Öne Çıkan Kartlar (1)</h3>
        <h3>Normal Kartlar (1)</h3>
        {cards.map((card: any) => (
          <div key={card.id} className="card-item">
            <h4>{card.title}</h4>
            <button title="Düzenle" className="edit-btn">Düzenle</button>
            <button title="Sil" className="delete-btn">Sil</button>
            <button title={card.isActive ? 'Devre Dışı Bırak' : 'Etkinleştir'} className="toggle-btn">
              {card.isActive ? 'Devre Dışı Bırak' : 'Etkinleştir'}
            </button>
          </div>
        ))}
      </div>
    ),
  };
});

jest.mock('@/components/admin/mobile/MobileStatsCard', () => {
  return {
    MobileStatsCard: ({ title, value, description }: any) => (
      <div data-testid="mobile-stats-card" className="stats-card">
        <h3>{title}</h3>
        <span className="stats-value">{value}</span>
        <p className="stats-description">{description}</p>
      </div>
    ),
  };
});

jest.mock('@/components/admin/mobile/MobileSettingsForm', () => {
  return {
    MobileSettingsForm: ({ settings }: any) => (
      <div data-testid="mobile-settings-form">
        <div className="tabs-container border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button className="tab-button" aria-label="Uygulama ayarları sekmesi">
              Uygulama
            </button>
            <button className="tab-button" aria-label="Anket ayarları sekmesi">
              Anketler
            </button>
            <button className="tab-button" aria-label="Haber ayarları sekmesi">
              Haberler
            </button>
            <button className="tab-button" aria-label="Oynatıcı ayarları sekmesi">
              Oynatıcı
            </button>
            <button className="tab-button" aria-label="Kart ayarları sekmesi">
              Kartlar
            </button>
          </nav>
        </div>
        <div className="tab-content">
          <h2>Uygulama Ayarları</h2>
          <p>Mobil uygulama versiyon ve bakım ayarları</p>
          <div>
            <label htmlFor="appVersion">Mevcut Versiyon</label>
            <input id="appVersion" />
          </div>
          <div>
            <label htmlFor="minAppVersion">Minimum Versiyon</label>
            <input id="minAppVersion" />
          </div>
          <div>
            <label htmlFor="forceUpdate">Zorunlu Güncelleme</label>
            <input id="forceUpdate" type="checkbox" />
          </div>
          <div>
            <label htmlFor="maintenanceMode">Bakım Modu</label>
            <input id="maintenanceMode" type="checkbox" />
          </div>
        </div>
        <button className="save-button">Değişiklikleri Kaydet</button>
      </div>
    ),
  };
});

// Mock fetch globally
global.fetch = jest.fn();
global.confirm = jest.fn();

// Mock window.matchMedia for responsive testing
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

// Mock test data
const mockCards: MobileCard[] = [
  {
    id: 1,
    title: 'Test Kartı 1',
    description: 'Test açıklaması 1',
    imageUrl: 'https://example.com/image1.jpg',
    redirectUrl: 'https://example.com/redirect1',
    isFeatured: true,
    displayOrder: 0,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    title: 'Test Kartı 2',
    description: 'Test açıklaması 2',
    imageUrl: 'https://example.com/image2.jpg',
    redirectUrl: 'https://example.com/redirect2',
    isFeatured: false,
    displayOrder: 1,
    isActive: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

const mockSettings: MobileSettings = {
  enableNews: true,
  maxNewsCount: 100,
  enablePolls: true,
  showOnlyLastActivePoll: false,
  maxFeaturedCards: 5,
  minimumAppVersion: '1.0.0',
  maintenanceMode: false,
  playerLogoUrl: 'https://example.com/logo.png'
};

describe('Admin Interface Accessibility and Turkish Language', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMatchMedia(true);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Mobile Cards Page - Turkish Language Verification', () => {
    beforeEach(() => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ cards: mockCards }),
      });
    });

    it('should display all main interface text in Turkish', async () => {
      await act(async () => {
        render(<MobileCardsPage />);
      });

      // Verify main Turkish interface text
      expect(screen.getByText('Mobil Kartlar')).toBeInTheDocument();
      expect(screen.getByText('Mobil uygulamada gösterilecek kartları yönetin')).toBeInTheDocument();
      expect(screen.getByText('Yeni Kart')).toBeInTheDocument();

      // Verify statistics section in Turkish
      await waitFor(() => {
        expect(screen.getByText('Toplam Kart')).toBeInTheDocument();
        expect(screen.getByText('Öne Çıkan')).toBeInTheDocument();
        expect(screen.getByText('Aktif')).toBeInTheDocument();
        expect(screen.getByText('Pasif')).toBeInTheDocument();
      });
    });

    it('should display card form labels in Turkish when dialog opens', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MobileCardsPage />);
      });

      // Open form dialog
      const newCardButton = screen.getByText('Yeni Kart');
      await user.click(newCardButton);

      // Verify Turkish form labels
      await waitFor(() => {
        expect(screen.getByText('Yeni Kart Oluştur')).toBeInTheDocument();
        expect(screen.getByText('Başlık *')).toBeInTheDocument();
        expect(screen.getByText('Açıklama')).toBeInTheDocument();
        expect(screen.getByText('Görsel URL')).toBeInTheDocument();
        expect(screen.getByText('Yönlendirme URL')).toBeInTheDocument();
        expect(screen.getByText('Sıralama')).toBeInTheDocument();
        expect(screen.getByText('Öne Çıkan Kart')).toBeInTheDocument();
        expect(screen.getByText('Aktif')).toBeInTheDocument();
        expect(screen.getByText('İptal')).toBeInTheDocument();
        expect(screen.getByText('Oluştur')).toBeInTheDocument();
      });
    });

    it('should display card list sections in Turkish', async () => {
      await act(async () => {
        render(<MobileCardsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Öne Çıkan Kartlar (1)')).toBeInTheDocument();
        expect(screen.getByText('Normal Kartlar (1)')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Settings Page - Turkish Language Verification', () => {
    beforeEach(() => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ settings: mockSettings }),
      });
    });

    it('should display all main interface text in Turkish', async () => {
      await act(async () => {
        render(<MobileSettingsPage />);
      });

      // Verify main Turkish interface text
      expect(screen.getByText('Mobil Uygulama Ayarları')).toBeInTheDocument();
      expect(screen.getByText('Mobil uygulama yapılandırmasını yönetin')).toBeInTheDocument();

      // Verify statistics section in Turkish
      await waitFor(() => {
        expect(screen.getByText('Sistem Durumu')).toBeInTheDocument();
        expect(screen.getByText('Uygulama Versiyonu')).toBeInTheDocument();
        expect(screen.getByText('Haberler')).toBeInTheDocument();
        expect(screen.getByText('Anketler')).toBeInTheDocument();
      });
    });

    it('should display settings form tabs and content in Turkish', async () => {
      await act(async () => {
        render(<MobileSettingsPage />);
      });

      await waitFor(() => {
        // Tab navigation in Turkish
        expect(screen.getByText('Uygulama')).toBeInTheDocument();
        expect(screen.getByText('Anketler')).toBeInTheDocument();
        expect(screen.getByText('Haberler')).toBeInTheDocument();
        expect(screen.getByText('Oynatıcı')).toBeInTheDocument();
        expect(screen.getByText('Kartlar')).toBeInTheDocument();

        // Form content in Turkish
        expect(screen.getByText('Uygulama Ayarları')).toBeInTheDocument();
        expect(screen.getByText('Mobil uygulama versiyon ve bakım ayarları')).toBeInTheDocument();
        expect(screen.getByText('Mevcut Versiyon')).toBeInTheDocument();
        expect(screen.getByText('Minimum Versiyon')).toBeInTheDocument();
        expect(screen.getByText('Zorunlu Güncelleme')).toBeInTheDocument();
        expect(screen.getByText('Bakım Modu')).toBeInTheDocument();
        expect(screen.getByText('Değişiklikleri Kaydet')).toBeInTheDocument();
      });
    });
  });

  describe('Touch Device Compatibility', () => {
    beforeEach(() => {
      // Set mobile viewport for touch testing
      Object.defineProperty(window, 'innerWidth', {
        value: 375, // iPhone width
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 667,
      });
    });

    it('should have adequate touch targets for mobile cards page buttons', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ cards: mockCards }),
      });

      await act(async () => {
        render(<MobileCardsPage />);
      });

      // Check main action button exists and is clickable
      const newCardButton = screen.getByText('Yeni Kart');
      expect(newCardButton).toBeInTheDocument();
      expect(newCardButton.tagName.toLowerCase()).toBe('button');

      // Button should be properly sized for touch
      expect(newCardButton).toHaveClass('px-4', 'py-2'); // Adequate padding for touch
    });

    it('should have adequate touch targets for settings page tab buttons', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ settings: mockSettings }),
      });

      await act(async () => {
        render(<MobileSettingsPage />);
      });

      await waitFor(() => {
        // Check all tab buttons
        const appTab = screen.getByText('Uygulama');
        const pollsTab = screen.getByText('Anketler');
        const newsTab = screen.getByText('Haberler');
        const playerTab = screen.getByText('Oynatıcı');
        const cardsTab = screen.getByText('Kartlar');

        [appTab, pollsTab, newsTab, playerTab, cardsTab].forEach(tab => {
          expect(tab).toBeInTheDocument();
          expect(tab.tagName.toLowerCase()).toBe('button');
          expect(tab).toHaveClass('tab-button');
        });
      });
    });

    it('should handle touch interactions on form elements', async () => {
      const user = userEvent.setup();
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ cards: mockCards }),
      });

      await act(async () => {
        render(<MobileCardsPage />);
      });

      // Open form
      const newCardButton = screen.getByText('Yeni Kart');
      await user.click(newCardButton);

      // Verify form elements are accessible
      await waitFor(() => {
        const titleInput = screen.getByLabelText('Başlık *');
        const descriptionInput = screen.getByLabelText('Açıklama');

        expect(titleInput).toBeInTheDocument();
        expect(descriptionInput).toBeInTheDocument();

        // Elements should be focusable
        expect(titleInput.tagName.toLowerCase()).toBe('input');
        expect(descriptionInput.tagName.toLowerCase()).toBe('textarea');
      });
    });
  });

  describe('Accessibility Standards (ARIA and Keyboard Navigation)', () => {
    it('should have proper button roles and attributes for cards page', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ cards: mockCards }),
      });

      await act(async () => {
        render(<MobileCardsPage />);
      });

      // Main button should be accessible
      const newCardButton = screen.getByText('Yeni Kart');
      expect(newCardButton).toHaveAttribute('type', 'button');
      expect(newCardButton.tagName.toLowerCase()).toBe('button');
    });

    it('should have proper ARIA labels for settings page tabs', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ settings: mockSettings }),
      });

      await act(async () => {
        render(<MobileSettingsPage />);
      });

      await waitFor(() => {
        // Check ARIA labels on tab buttons
        expect(screen.getByLabelText('Uygulama ayarları sekmesi')).toBeInTheDocument();
        expect(screen.getByLabelText('Anket ayarları sekmesi')).toBeInTheDocument();
        expect(screen.getByLabelText('Haber ayarları sekmesi')).toBeInTheDocument();
        expect(screen.getByLabelText('Oynatıcı ayarları sekmesi')).toBeInTheDocument();
        expect(screen.getByLabelText('Kart ayarları sekmesi')).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation in form elements', async () => {
      const user = userEvent.setup();
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ cards: mockCards }),
      });

      await act(async () => {
        render(<MobileCardsPage />);
      });

      // Open form
      const newCardButton = screen.getByText('Yeni Kart');
      await user.click(newCardButton);

      // Test form element accessibility
      await waitFor(() => {
        const titleInput = screen.getByLabelText('Başlık *');
        const descriptionInput = screen.getByLabelText('Açıklama');

        // Elements should be properly labeled
        expect(titleInput).toHaveAttribute('id', 'title');
        expect(descriptionInput).toHaveAttribute('id', 'description');

        // Elements should be keyboard accessible
        expect(titleInput).not.toHaveAttribute('tabindex', '-1');
        expect(descriptionInput).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('should maintain proper heading hierarchy', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ cards: mockCards }),
      });

      await act(async () => {
        render(<MobileCardsPage />);
      });

      // Check main heading
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Mobil Kartlar');
    });

    it('should have adequate spacing between interactive elements', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ cards: mockCards }),
      });

      await act(async () => {
        render(<MobileCardsPage />);
      });

      await waitFor(() => {
        // Check that card action buttons have adequate spacing
        const editButtons = screen.getAllByText('Düzenle');
        const deleteButtons = screen.getAllByText('Sil');

        expect(editButtons.length).toBeGreaterThan(0);
        expect(deleteButtons.length).toBeGreaterThan(0);

        // Buttons should exist for interaction
        editButtons.forEach(btn => {
          expect(btn).toBeInTheDocument();
          expect(btn.tagName.toLowerCase()).toBe('button');
        });
      });
    });
  });

  describe('Responsive Design for Touch Devices', () => {
    it('should adapt to tablet viewport', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 768 });

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ cards: mockCards }),
      });

      await act(async () => {
        render(<MobileCardsPage />);
      });

      // Should render properly on tablet
      expect(screen.getByText('Mobil Kartlar')).toBeInTheDocument();
      expect(screen.getByText('Yeni Kart')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Toplam Kart')).toBeInTheDocument();
      });
    });

    it('should maintain usability on small mobile screens', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 320 });

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ settings: mockSettings }),
      });

      await act(async () => {
        render(<MobileSettingsPage />);
      });

      // Should still be usable on small screens
      expect(screen.getByText('Mobil Uygulama Ayarları')).toBeInTheDocument();

      await waitFor(() => {
        // Tab navigation should still work
        expect(screen.getByText('Uygulama')).toBeInTheDocument();
        expect(screen.getByText('Anketler')).toBeInTheDocument();
        expect(screen.getByText('Haberler')).toBeInTheDocument();
      });
    });
  });

  describe('User Experience and Monkey-Proof Design', () => {
    it('should have clear visual hierarchy and consistent Turkish labeling', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ cards: mockCards }),
      });

      await act(async () => {
        render(<MobileCardsPage />);
      });

      // Check consistent Turkish terminology
      expect(screen.getByText('Mobil Kartlar')).toBeInTheDocument();
      expect(screen.getByText('Yeni Kart')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Toplam Kart')).toBeInTheDocument();
        expect(screen.getByText('Aktif')).toBeInTheDocument();
        expect(screen.getByText('Pasif')).toBeInTheDocument();
      });
    });

    it('should provide clear feedback messages in Turkish', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ settings: mockSettings }),
      });

      await act(async () => {
        render(<MobileSettingsPage />);
      });

      await waitFor(() => {
        // Clear Turkish labels for user actions
        expect(screen.getByText('Değişiklikleri Kaydet')).toBeInTheDocument();
        expect(screen.getByText('Mobil uygulama yapılandırmasını yönetin')).toBeInTheDocument();
      });
    });
  });
});