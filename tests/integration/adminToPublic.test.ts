import { NextRequest } from 'next/server';
import { POST as createNews, PUT as updateNews } from '@/app/api/admin/news/route';
import { GET as getPublicNews } from '@/app/api/news/route';
import { POST as createPoll, PATCH as updatePoll } from '@/app/api/admin/polls/route';
import { GET as getPublicPolls } from '@/app/api/polls/route';
import { invalidateEntityCache } from '@/lib/cache/invalidation';

// Mock dependencies
jest.mock('@/lib/auth/utils');
jest.mock('@/lib/db/news');
jest.mock('@/lib/db/polls');
jest.mock('@/lib/db/poll-votes');
jest.mock('@/lib/cache/invalidation');
jest.mock('@/lib/storage/client');

// Import mocked functions
import { getServerSession, checkRole, getUserId } from '@/lib/auth/utils';
import {
  createNews as dbCreateNews,
  updateNews as dbUpdateNews,
  getNewsById,
  getAllNews
} from '@/lib/db/news';
import {
  createPoll as dbCreatePoll,
  updatePoll as dbUpdatePoll,
  getPollById,
  getAllPolls
} from '@/lib/db/polls';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockCheckRole = checkRole as jest.MockedFunction<typeof checkRole>;
const mockGetUserId = getUserId as jest.MockedFunction<typeof getUserId>;
const mockDbCreateNews = dbCreateNews as jest.MockedFunction<typeof dbCreateNews>;
const mockDbUpdateNews = dbUpdateNews as jest.MockedFunction<typeof dbUpdateNews>;
const mockGetNewsById = getNewsById as jest.MockedFunction<typeof getNewsById>;
const mockGetAllNews = getAllNews as jest.MockedFunction<typeof getAllNews>;
const mockDbCreatePoll = dbCreatePoll as jest.MockedFunction<typeof dbCreatePoll>;
const mockDbUpdatePoll = dbUpdatePoll as jest.MockedFunction<typeof dbUpdatePoll>;
const mockGetPollById = getPollById as jest.MockedFunction<typeof getPollById>;
const mockGetAllPolls = getAllPolls as jest.MockedFunction<typeof getAllPolls>;
const mockInvalidateEntityCache = invalidateEntityCache as jest.MockedFunction<typeof invalidateEntityCache>;

describe('Admin to Public Content Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock authentication
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', email: 'admin@test.com' }
    } as any);
    mockCheckRole.mockReturnValue(true);
    mockGetUserId.mockReturnValue('1');
  });

  describe('News Publication Flow', () => {
    const mockNewsData = {
      title: 'Test News Article',
      content: 'This is a test news article content',
      summary: 'Test summary',
      category_id: 1,
      is_featured: false,
      is_breaking: false,
      is_hot: false,
      is_active: true,
      published_at: null
    };

    const mockCreatedNews = {
      id: 1,
      slug: 'test-news-article',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
      created_by: 1,
      ...mockNewsData
    };

    it('should create news in admin and make it available in public API', async () => {
      // Setup mocks for news creation
      mockDbCreateNews.mockResolvedValue(1);
      mockGetNewsById.mockResolvedValue(mockCreatedNews);

      // Step 1: Create news via admin API
      const createRequest = new NextRequest('http://localhost/api/admin/news', {
        method: 'POST',
        body: JSON.stringify(mockNewsData)
      });

      const createResponse = await createNews(createRequest);
      const createData = await createResponse.json();

      expect(createResponse.status).toBe(200);
      expect(createData.success).toBe(true);
      expect(createData.data.title).toBe(mockNewsData.title);
      expect(mockInvalidateEntityCache).toHaveBeenCalledWith('news');

      // Step 2: Verify news appears in public API
      mockGetAllNews.mockResolvedValue({
        data: [mockCreatedNews],
        total: 1,
        hasNext: false,
        hasPrev: false
      });

      const publicRequest = new NextRequest('http://localhost/api/news');
      const publicResponse = await getPublicNews(publicRequest);
      const publicData = await publicResponse.json();

      expect(publicResponse.status).toBe(200);
      expect(publicData.success).toBe(true);
      expect(publicData.data).toHaveLength(1);
      expect(publicData.data[0].title).toBe(mockNewsData.title);
    });

    it('should update news status and reflect changes in public API', async () => {
      // Setup mocks for news update
      const updatedNews = { ...mockCreatedNews, is_featured: true };
      mockGetNewsById.mockResolvedValueOnce(mockCreatedNews)
                     .mockResolvedValueOnce(updatedNews);
      mockDbUpdateNews.mockResolvedValue({ affectedRows: 1 } as any);

      // Step 1: Update news via admin API
      const updateRequest = new NextRequest('http://localhost/api/admin/news', {
        method: 'PUT',
        body: JSON.stringify({
          id: 1,
          is_featured: true
        })
      });

      const updateResponse = await updateNews(updateRequest);
      const updateData = await updateResponse.json();

      expect(updateResponse.status).toBe(200);
      expect(updateData.success).toBe(true);
      expect(updateData.data.is_featured).toBe(true);
      expect(mockInvalidateEntityCache).toHaveBeenCalledWith('news', '1');

      // Step 2: Verify changes appear in public API
      mockGetAllNews.mockResolvedValue({
        data: [updatedNews],
        total: 1,
        hasNext: false,
        hasPrev: false
      });

      const publicRequest = new NextRequest('http://localhost/api/news');
      const publicResponse = await getPublicNews(publicRequest);
      const publicData = await publicResponse.json();

      expect(publicResponse.status).toBe(200);
      expect(publicData.data[0].is_featured).toBe(true);
    });

    it('should handle news deactivation and removal from public feed', async () => {
      const deactivatedNews = { ...mockCreatedNews, is_active: false };
      mockGetNewsById.mockResolvedValueOnce(mockCreatedNews)
                     .mockResolvedValueOnce(deactivatedNews);
      mockDbUpdateNews.mockResolvedValue({ affectedRows: 1 } as any);

      // Step 1: Deactivate news via admin API
      const updateRequest = new NextRequest('http://localhost/api/admin/news', {
        method: 'PUT',
        body: JSON.stringify({
          id: 1,
          is_active: false
        })
      });

      const updateResponse = await updateNews(updateRequest);
      expect(updateResponse.status).toBe(200);
      expect(mockInvalidateEntityCache).toHaveBeenCalledWith('news', '1');

      // Step 2: Verify news is filtered out from public API
      mockGetAllNews.mockResolvedValue({
        data: [], // No active news
        total: 0,
        hasNext: false,
        hasPrev: false
      });

      const publicRequest = new NextRequest('http://localhost/api/news');
      const publicResponse = await getPublicNews(publicRequest);
      const publicData = await publicResponse.json();

      expect(publicResponse.status).toBe(200);
      expect(publicData.data).toHaveLength(0);
    });
  });

  describe('Poll Activation Flow', () => {
    const mockPollData = {
      title: 'Test Poll',
      description: 'This is a test poll',
      poll_type: 'weekly' as const,
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      is_active: false,
      show_on_homepage: false
    };

    const mockCreatedPoll = {
      id: 1,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
      created_by: 1,
      ...mockPollData
    };

    it('should create inactive poll and then activate it for public display', async () => {
      // Setup mocks for poll creation
      mockDbCreatePoll.mockResolvedValue(1);

      // Step 1: Create inactive poll via admin API
      const createRequest = new NextRequest('http://localhost/api/admin/polls', {
        method: 'POST',
        body: JSON.stringify(mockPollData)
      });

      const createResponse = await createPoll(createRequest);
      const createData = await createResponse.json();

      expect(createResponse.status).toBe(200);
      expect(createData.success).toBe(true);
      expect(mockInvalidateEntityCache).toHaveBeenCalledWith('polls');

      // Step 2: Activate poll via admin API
      const activatedPoll = { ...mockCreatedPoll, is_active: true };
      mockGetPollById.mockResolvedValue(mockCreatedPoll);
      mockDbUpdatePoll.mockResolvedValue({ affectedRows: 1 } as any);

      const activateRequest = new NextRequest('http://localhost/api/admin/polls', {
        method: 'PATCH',
        body: JSON.stringify({
          id: 1,
          action: 'activate'
        })
      });

      const activateResponse = await updatePoll(activateRequest);
      expect(activateResponse.status).toBe(200);
      expect(mockInvalidateEntityCache).toHaveBeenCalledWith('polls', '1');

      // Step 3: Verify active poll appears in public API
      mockGetAllPolls.mockResolvedValue({
        data: [activatedPoll],
        total: 1,
        hasNext: false,
        hasPrev: false
      });

      const publicRequest = new NextRequest('http://localhost/api/polls');
      const publicResponse = await getPublicPolls(publicRequest);
      const publicData = await publicResponse.json();

      expect(publicResponse.status).toBe(200);
      expect(publicData.success).toBe(true);
      expect(publicData.data).toHaveLength(1);
      expect(publicData.data[0].is_active).toBe(true);
    });

    it('should handle poll homepage visibility toggle', async () => {
      const poll = { ...mockCreatedPoll, is_active: true };
      const featuredPoll = { ...poll, show_on_homepage: true };

      mockGetPollById.mockResolvedValue(poll);
      mockDbUpdatePoll.mockResolvedValue({ affectedRows: 1 } as any);

      // Step 1: Set poll to show on homepage
      const toggleRequest = new NextRequest('http://localhost/api/admin/polls', {
        method: 'PATCH',
        body: JSON.stringify({
          id: 1,
          action: 'toggle_homepage',
          value: true
        })
      });

      const toggleResponse = await updatePoll(toggleRequest);
      expect(toggleResponse.status).toBe(200);
      expect(mockInvalidateEntityCache).toHaveBeenCalledWith('polls', '1');

      // Step 2: Verify featured poll appears in public API
      mockGetAllPolls.mockResolvedValue({
        data: [featuredPoll],
        total: 1,
        hasNext: false,
        hasPrev: false
      });

      const publicRequest = new NextRequest('http://localhost/api/polls?featured=true');
      const publicResponse = await getPublicPolls(publicRequest);
      const publicData = await publicResponse.json();

      expect(publicResponse.status).toBe(200);
      expect(publicData.data[0].show_on_homepage).toBe(true);
    });
  });

  describe('Cache Invalidation Verification', () => {
    it('should invalidate cache for all content operations', async () => {
      // News operations
      mockDbCreateNews.mockResolvedValue(1);
      mockGetNewsById.mockResolvedValue({
        id: 1,
        title: 'Test',
        content: 'Test',
        slug: 'test',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 1
      });

      const newsRequest = new NextRequest('http://localhost/api/admin/news', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test News',
          content: 'Test content'
        })
      });

      await createNews(newsRequest);
      expect(mockInvalidateEntityCache).toHaveBeenCalledWith('news');

      // Poll operations
      mockDbCreatePoll.mockResolvedValue(1);

      const pollRequest = new NextRequest('http://localhost/api/admin/polls', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Poll',
          start_date: '2024-01-01',
          end_date: '2024-01-31'
        })
      });

      await createPoll(pollRequest);
      expect(mockInvalidateEntityCache).toHaveBeenCalledWith('polls');
    });

    it('should handle cache invalidation failures gracefully', async () => {
      // Mock cache invalidation to fail
      mockInvalidateEntityCache.mockRejectedValue(new Error('Cache service unavailable'));

      mockDbCreateNews.mockResolvedValue(1);
      mockGetNewsById.mockResolvedValue({
        id: 1,
        title: 'Test',
        content: 'Test',
        slug: 'test',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 1
      });

      const newsRequest = new NextRequest('http://localhost/api/admin/news', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test News',
          content: 'Test content'
        })
      });

      // Should still succeed even if cache invalidation fails
      const response = await createNews(newsRequest);
      expect(response.status).toBe(200);
    });
  });

  describe('Content Consistency', () => {
    it('should maintain data consistency between admin and public APIs', async () => {
      const newsData = {
        title: 'Consistency Test',
        content: 'Test content',
        summary: 'Test summary',
        is_active: true
      };

      const createdNews = {
        id: 1,
        slug: 'consistency-test',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 1,
        ...newsData
      };

      // Create via admin API
      mockDbCreateNews.mockResolvedValue(1);
      mockGetNewsById.mockResolvedValue(createdNews);

      const adminRequest = new NextRequest('http://localhost/api/admin/news', {
        method: 'POST',
        body: JSON.stringify(newsData)
      });

      const adminResponse = await createNews(adminRequest);
      const adminData = await adminResponse.json();

      // Fetch via public API
      mockGetAllNews.mockResolvedValue({
        data: [createdNews],
        total: 1,
        hasNext: false,
        hasPrev: false
      });

      const publicRequest = new NextRequest('http://localhost/api/news');
      const publicResponse = await getPublicNews(publicRequest);
      const publicData = await publicResponse.json();

      // Verify data consistency
      expect(adminData.data.title).toBe(publicData.data[0].title);
      expect(adminData.data.content).toBe(publicData.data[0].content);
      expect(adminData.data.is_active).toBe(publicData.data[0].is_active);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle database errors during content flow', async () => {
      mockDbCreateNews.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost/api/admin/news', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test',
          content: 'Test'
        })
      });

      const response = await createNews(request);
      expect(response.status).toBe(500);

      // Cache should not be invalidated on error
      expect(mockInvalidateEntityCache).not.toHaveBeenCalled();
    });

    it('should handle authentication failures', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/admin/news', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test',
          content: 'Test'
        })
      });

      const response = await createNews(request);
      expect(response.status).toBe(401);

      // No database operations should occur
      expect(mockDbCreateNews).not.toHaveBeenCalled();
      expect(mockInvalidateEntityCache).not.toHaveBeenCalled();
    });
  });
});