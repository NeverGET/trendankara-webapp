/**
 * Mobile Cards API Endpoint Test
 * Tests the mobile cards API endpoint for proper response format and mobile app consumption
 * Requirements: 3.1, 7.4, 7.7 - Mobile API response format verification
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/mobile/v1/content/cards/route';
import cardService from '@/services/mobile/CardService';
import cacheManager from '@/lib/cache/MobileCacheManager';
import type { MobileApiResponse, MobileCard } from '@/types/mobile';

// Mock dependencies
jest.mock('@/services/mobile/CardService');
jest.mock('@/lib/cache/MobileCacheManager');

const mockCardService = cardService as jest.Mocked<typeof cardService>;
const mockCacheManager = cacheManager as jest.Mocked<typeof cacheManager>;

describe('Mobile Cards API Endpoint Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Clear cache for each test
    mockCacheManager.get.mockReturnValue(null);

    // Mock cache manager set method to return proper entry
    mockCacheManager.set.mockReturnValue({
      data: mockMobileCards,
      etag: 'test-etag-123',
      expires: Date.now() + 180000,
      created: Date.now()
    });
  });

  // Mock mobile card data that follows the MobileCard interface
  const mockMobileCards: MobileCard[] = [
    {
      id: 1,
      title: 'Featured Sponsor Card',
      description: 'Premium sponsor content for mobile display',
      imageUrl: 'https://example.com/image1.jpg',
      redirectUrl: 'https://sponsor1.com',
      isFeatured: true,
      displayOrder: 1,
      isActive: true,
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z'
    },
    {
      id: 2,
      title: 'Normal Content Card',
      description: 'Regular content card with optional fields',
      imageUrl: 'https://example.com/image2.jpg',
      redirectUrl: undefined,
      isFeatured: false,
      displayOrder: 2,
      isActive: true,
      createdAt: '2024-01-01T11:00:00Z',
      updatedAt: '2024-01-01T11:00:00Z'
    },
    {
      id: 3,
      title: 'Simple Card Without Image',
      description: undefined,
      imageUrl: undefined,
      redirectUrl: 'https://example.com/redirect',
      isFeatured: false,
      displayOrder: 3,
      isActive: true,
      createdAt: '2024-01-01T12:00:00Z',
      updatedAt: '2024-01-01T12:00:00Z'
    }
  ];

  describe('GET /api/mobile/v1/content/cards', () => {
    it('should return proper JSON response format for mobile consumption', async () => {
      // Mock card service to return test data
      mockCardService.getCards.mockResolvedValue(mockMobileCards);

      const request = new NextRequest('http://localhost/api/mobile/v1/content/cards');

      const startTime = performance.now();
      const response = await GET(request);
      const endTime = performance.now();

      const responseTime = endTime - startTime;
      const data = await response.json() as MobileApiResponse<MobileCard[]>;

      // Test response format
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('cache');
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);

      // Verify response time is reasonable for mobile consumption
      expect(responseTime).toBeLessThan(500); // Should be under 500ms

      console.log(`API Response time: ${Math.round(responseTime)}ms`);
    });

    it('should return cards with proper MobileCard interface fields', async () => {
      mockCardService.getCards.mockResolvedValue(mockMobileCards);

      const request = new NextRequest('http://localhost/api/mobile/v1/content/cards');
      const response = await GET(request);
      const data = await response.json() as MobileApiResponse<MobileCard[]>;

      expect(data.data).toHaveLength(3);

      // Test each card has required MobileCard interface fields
      data.data.forEach((card, index) => {
        expect(card).toHaveProperty('id');
        expect(card).toHaveProperty('title');
        expect(card).toHaveProperty('isFeatured');
        expect(card).toHaveProperty('displayOrder');
        expect(card).toHaveProperty('isActive');

        expect(typeof card.id).toBe('number');
        expect(typeof card.title).toBe('string');
        expect(typeof card.isFeatured).toBe('boolean');
        expect(typeof card.displayOrder).toBe('number');
        expect(typeof card.isActive).toBe('boolean');

        // Verify optional fields are handled correctly
        if (card.description !== undefined) {
          expect(typeof card.description).toBe('string');
        }
        if (card.imageUrl !== undefined) {
          expect(typeof card.imageUrl).toBe('string');
        }
        if (card.redirectUrl !== undefined) {
          expect(typeof card.redirectUrl).toBe('string');
        }
        if (card.createdAt !== undefined) {
          expect(typeof card.createdAt).toBe('string');
        }
        if (card.updatedAt !== undefined) {
          expect(typeof card.updatedAt).toBe('string');
        }

        console.log(`Card ${index + 1}: ${card.title} (Featured: ${card.isFeatured})`);
      });
    });

    it('should include proper caching headers for mobile performance', async () => {
      mockCardService.getCards.mockResolvedValue(mockMobileCards);

      // Mock cache entry
      const mockCacheEntry = {
        data: mockMobileCards,
        etag: 'test-etag-123',
        expires: Date.now() + 180000,
        created: Date.now()
      };
      mockCacheManager.set.mockReturnValue(mockCacheEntry);

      const request = new NextRequest('http://localhost/api/mobile/v1/content/cards');
      const response = await GET(request);

      // Check cache control headers
      const cacheControl = response.headers.get('Cache-Control');
      const etag = response.headers.get('ETag');

      expect(cacheControl).toContain('public');
      expect(cacheControl).toContain('max-age=180'); // 3 minutes as defined in route
      expect(etag).toBe('test-etag-123');

      console.log(`Cache headers: Cache-Control: ${cacheControl}, ETag: ${etag}`);
    });

    it('should support type filtering for mobile app consumption', async () => {
      const featuredCards = mockMobileCards.filter(card => card.isFeatured);
      mockCardService.getCards.mockResolvedValue(featuredCards);

      // Test with type=featured filter
      const request = new NextRequest('http://localhost/api/mobile/v1/content/cards?type=featured');
      const response = await GET(request);
      const data = await response.json() as MobileApiResponse<MobileCard[]>;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockCardService.getCards).toHaveBeenCalledWith('featured');

      // All returned cards should be featured
      data.data.forEach(card => {
        expect(card.isFeatured).toBe(true);
      });

      console.log(`Featured cards returned: ${data.data.length}`);
    });

    it('should support normal type filtering', async () => {
      const normalCards = mockMobileCards.filter(card => !card.isFeatured);
      mockCardService.getCards.mockResolvedValue(normalCards);

      // Test with type=normal filter
      const request = new NextRequest('http://localhost/api/mobile/v1/content/cards?type=normal');
      const response = await GET(request);
      const data = await response.json() as MobileApiResponse<MobileCard[]>;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockCardService.getCards).toHaveBeenCalledWith('normal');

      // All returned cards should be normal (not featured)
      data.data.forEach(card => {
        expect(card.isFeatured).toBe(false);
      });

      console.log(`Normal cards returned: ${data.data.length}`);
    });

    it('should handle conditional requests with If-None-Match header', async () => {
      const testETag = 'test-etag-123';

      // Mock cached data
      const mockCacheEntry = {
        data: mockMobileCards,
        etag: testETag,
        expires: Date.now() + 180000,
        created: Date.now()
      };
      mockCacheManager.get.mockReturnValue(mockCacheEntry);

      const request = new NextRequest('http://localhost/api/mobile/v1/content/cards', {
        headers: {
          'if-none-match': testETag
        }
      });

      const response = await GET(request);

      // Should return cached data with proper headers
      expect(response.status).toBe(200);
      expect(response.headers.get('ETag')).toBe(testETag);
      expect(response.headers.get('Cache-Control')).toContain('public, max-age=180');

      console.log('Conditional request handled with proper cache headers');
    });

    it('should return cached data when available', async () => {
      const testETag = 'cached-etag-456';

      // Mock cached data
      const mockCacheEntry = {
        data: mockMobileCards,
        etag: testETag,
        expires: Date.now() + 180000,
        created: Date.now()
      };
      mockCacheManager.get.mockReturnValue(mockCacheEntry);

      const request = new NextRequest('http://localhost/api/mobile/v1/content/cards');
      const response = await GET(request);
      const data = await response.json() as MobileApiResponse<MobileCard[]>;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockMobileCards);
      expect(data.cache?.etag).toBe(testETag);
      expect(data.cache?.maxAge).toBe(180);

      // Should not call service when cached data is available
      expect(mockCardService.getCards).not.toHaveBeenCalled();

      console.log('Returned cached data without calling service');
    });

    it('should handle service errors gracefully for mobile app', async () => {
      mockCardService.getCards.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost/api/mobile/v1/content/cards');
      const response = await GET(request);
      const data = await response.json() as MobileApiResponse<MobileCard[]>;

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.data).toEqual([]);
      expect(data.error).toBe('Kartlar yüklenirken bir hata oluştu');

      console.log('Error response handled gracefully');
    });

    it('should handle empty card results properly', async () => {
      mockCardService.getCards.mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/mobile/v1/content/cards');

      const startTime = performance.now();
      const response = await GET(request);
      const endTime = performance.now();

      const responseTime = endTime - startTime;
      const data = await response.json() as MobileApiResponse<MobileCard[]>;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(Array.isArray(data.data)).toBe(true);

      // Should still be fast even with no data
      expect(responseTime).toBeLessThan(200);

      console.log(`Empty result response time: ${Math.round(responseTime)}ms`);
    });

    it('should verify card ordering for mobile display', async () => {
      mockCardService.getCards.mockResolvedValue(mockMobileCards);

      const request = new NextRequest('http://localhost/api/mobile/v1/content/cards');
      const response = await GET(request);
      const data = await response.json() as MobileApiResponse<MobileCard[]>;

      expect(data.success).toBe(true);

      // Verify cards are returned with proper ordering information
      const cards = data.data;
      expect(cards.length).toBeGreaterThan(0);

      // Check that display order values are present and valid
      cards.forEach(card => {
        expect(typeof card.displayOrder).toBe('number');
        expect(card.displayOrder).toBeGreaterThanOrEqual(0);
      });

      // Check if featured cards are present
      const featuredCards = cards.filter(card => card.isFeatured);
      const normalCards = cards.filter(card => !card.isFeatured);

      console.log(`Total cards: ${cards.length}, Featured: ${featuredCards.length}, Normal: ${normalCards.length}`);
    });

    it('should validate response structure for mobile API requirements', async () => {
      mockCardService.getCards.mockResolvedValue(mockMobileCards);

      const request = new NextRequest('http://localhost/api/mobile/v1/content/cards');
      const response = await GET(request);
      const data = await response.json();

      // Validate exact response structure required by mobile app
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('cache');
      expect(typeof data.success).toBe('boolean');
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.cache).toHaveProperty('etag');
      expect(data.cache).toHaveProperty('maxAge');

      // Verify success is true
      expect(data.success).toBe(true);

      // Should not have error field when successful
      expect(data).not.toHaveProperty('error');

      console.log('Mobile API response structure validated');
    });
  });

  describe('Performance Requirements', () => {
    it('should meet sub-200ms response time requirement', async () => {
      mockCardService.getCards.mockResolvedValue(mockMobileCards);

      const measurements: number[] = [];

      // Test multiple requests to get average response time
      for (let i = 0; i < 5; i++) {
        const request = new NextRequest('http://localhost/api/mobile/v1/content/cards');

        const startTime = performance.now();
        const response = await GET(request);
        await response.json();
        const endTime = performance.now();

        const responseTime = endTime - startTime;
        measurements.push(responseTime);
      }

      const averageTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const maxTime = Math.max(...measurements);

      expect(averageTime).toBeLessThan(200); // Average should be under 200ms
      expect(maxTime).toBeLessThan(500); // Max should be under 500ms

      console.log(`Average response time: ${Math.round(averageTime)}ms, Max: ${Math.round(maxTime)}ms`);
    });

    it('should handle concurrent requests efficiently', async () => {
      mockCardService.getCards.mockResolvedValue(mockMobileCards);

      const concurrentRequests = 10;
      const requests = Array.from({ length: concurrentRequests }, () => {
        const request = new NextRequest('http://localhost/api/mobile/v1/content/cards');
        return GET(request);
      });

      const startTime = performance.now();
      const responses = await Promise.all(requests);
      const endTime = performance.now();

      const totalTime = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Concurrent requests should not take much longer than a single request
      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second

      console.log(`${concurrentRequests} concurrent requests completed in ${Math.round(totalTime)}ms`);
    });
  });
});