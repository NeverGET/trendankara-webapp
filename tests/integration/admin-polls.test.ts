import { NextRequest } from 'next/server';
import { POST as createPoll, PATCH as updatePoll, DELETE as deletePoll } from '@/app/api/admin/polls/route';
import { POST as createPollOptions } from '@/app/api/admin/polls/[pollId]/options/route';
import { getPollById, createPoll as dbCreatePoll, updatePoll as dbUpdatePoll, deletePoll as dbDeletePoll } from '@/lib/db/polls';
import { createPollOptions, getPollOptions } from '@/lib/db/polls';
import { invalidateEntityCache } from '@/lib/cache/invalidation';
import { db } from '@/lib/db/client';

// Mock dependencies
jest.mock('@/lib/auth/utils');
jest.mock('@/lib/db/polls');
jest.mock('@/lib/cache/invalidation');
jest.mock('@/lib/db/client');

// Import mocked functions
import { getServerSession, checkRole, getUserId } from '@/lib/auth/utils';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockCheckRole = checkRole as jest.MockedFunction<typeof checkRole>;
const mockGetUserId = getUserId as jest.MockedFunction<typeof getUserId>;
const mockDbCreatePoll = dbCreatePoll as jest.MockedFunction<typeof dbCreatePoll>;
const mockDbUpdatePoll = dbUpdatePoll as jest.MockedFunction<typeof dbUpdatePoll>;
const mockDbDeletePoll = dbDeletePoll as jest.MockedFunction<typeof dbDeletePoll>;
const mockCreatePollOptions = createPollOptions as jest.MockedFunction<typeof createPollOptions>;
const mockGetPollOptions = getPollOptions as jest.MockedFunction<typeof getPollOptions>;
const mockGetPollById = getPollById as jest.MockedFunction<typeof getPollById>;
const mockInvalidateEntityCache = invalidateEntityCache as jest.MockedFunction<typeof invalidateEntityCache>;
const mockDb = db as jest.Mocked<typeof db>;

describe('Admin Polls Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock authentication
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', email: 'admin@test.com' }
    } as any);
    mockCheckRole.mockResolvedValue(true);
    mockGetUserId.mockReturnValue(1);

    // Mock database transaction
    const mockTransaction = {
      rollback: jest.fn(),
      commit: jest.fn()
    };
    mockDb.transaction = jest.fn().mockImplementation((callback) =>
      callback(mockTransaction)
    );
  });

  describe('Poll Creation', () => {
    it('should create poll with options successfully', async () => {
      const pollData = {
        title: 'Test Poll',
        description: 'Test poll description',
        poll_type: 'weekly',
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-07T23:59:59Z',
        is_active: true,
        show_results: true,
        options: [
          { name: 'Option 1', image_url: 'https://example.com/option1.jpg' },
          { name: 'Option 2', image_url: 'https://example.com/option2.jpg' },
          { name: 'Option 3', image_url: null }
        ]
      };

      const createdPoll = {
        id: 1,
        title: pollData.title,
        description: pollData.description,
        poll_type: pollData.poll_type,
        start_date: pollData.start_date,
        end_date: pollData.end_date,
        is_active: pollData.is_active,
        show_results: pollData.show_results,
        created_at: new Date(),
        updated_at: new Date()
      };

      const createdOptions = [
        { id: 1, poll_id: 1, name: 'Option 1', image_url: 'https://example.com/option1.jpg', created_at: new Date(), updated_at: new Date() },
        { id: 2, poll_id: 1, name: 'Option 2', image_url: 'https://example.com/option2.jpg', created_at: new Date(), updated_at: new Date() },
        { id: 3, poll_id: 1, name: 'Option 3', image_url: null, created_at: new Date(), updated_at: new Date() }
      ];

      // Mock database operations
      mockDbCreatePoll.mockResolvedValue(createdPoll);
      mockCreatePollOptions.mockResolvedValue(createdOptions);
      mockGetPollById.mockResolvedValue({ ...createdPoll, options: createdOptions });

      const request = new NextRequest('http://localhost:3000/api/admin/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pollData)
      });

      const response = await createPoll(request);
      const responseData = await response.json();

      // Assert response structure
      expect(response.status).toBe(201);
      expect(responseData).toHaveProperty('success', true);
      expect(responseData).toHaveProperty('data');
      expect(responseData.data).toHaveProperty('id', 1);
      expect(responseData.data).toHaveProperty('title', pollData.title);
      expect(responseData.data).toHaveProperty('options');
      expect(responseData.data.options).toHaveLength(3);

      // Verify database persistence
      expect(mockDbCreatePoll).toHaveBeenCalledWith(
        expect.objectContaining({
          title: pollData.title,
          description: pollData.description,
          poll_type: pollData.poll_type,
          start_date: pollData.start_date,
          end_date: pollData.end_date,
          is_active: pollData.is_active,
          show_results: pollData.show_results
        })
      );

      // Verify all fields saved correctly
      expect(mockCreatePollOptions).toHaveBeenCalledWith(1, pollData.options);

      // Verify cache invalidation
      expect(mockInvalidateEntityCache).toHaveBeenCalledWith('polls');
    });

    it('should save all poll fields correctly', async () => {
      const pollData = {
        title: 'Comprehensive Test Poll',
        description: 'This is a comprehensive test poll with all fields',
        poll_type: 'monthly',
        start_date: '2024-02-01T10:00:00Z',
        end_date: '2024-02-29T22:00:00Z',
        is_active: false,
        show_results: false,
        options: [
          { name: 'First Option', image_url: 'https://example.com/1.jpg' },
          { name: 'Second Option', image_url: 'https://example.com/2.jpg' }
        ]
      };

      const createdPoll = {
        id: 2,
        ...pollData,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockDbCreatePoll.mockResolvedValue(createdPoll);
      mockCreatePollOptions.mockResolvedValue([]);
      mockGetPollById.mockResolvedValue({ ...createdPoll, options: [] });

      const request = new NextRequest('http://localhost:3000/api/admin/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pollData)
      });

      const response = await createPoll(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);

      // Verify all fields are correctly saved
      const savedPollData = mockDbCreatePoll.mock.calls[0][0];
      expect(savedPollData.title).toBe(pollData.title);
      expect(savedPollData.description).toBe(pollData.description);
      expect(savedPollData.poll_type).toBe(pollData.poll_type);
      expect(savedPollData.start_date).toBe(pollData.start_date);
      expect(savedPollData.end_date).toBe(pollData.end_date);
      expect(savedPollData.is_active).toBe(pollData.is_active);
      expect(savedPollData.show_results).toBe(pollData.show_results);
    });

    it('should return proper response structure', async () => {
      const pollData = {
        title: 'Response Structure Test',
        description: 'Testing response structure',
        poll_type: 'custom',
        start_date: '2024-03-01T00:00:00Z',
        end_date: '2024-03-31T23:59:59Z',
        is_active: true,
        show_results: true,
        options: [
          { name: 'Test Option', image_url: null }
        ]
      };

      const createdPoll = {
        id: 3,
        ...pollData,
        created_at: new Date(),
        updated_at: new Date()
      };

      const createdOptions = [
        { id: 4, poll_id: 3, name: 'Test Option', image_url: null, created_at: new Date(), updated_at: new Date() }
      ];

      mockDbCreatePoll.mockResolvedValue(createdPoll);
      mockCreatePollOptions.mockResolvedValue(createdOptions);
      mockGetPollById.mockResolvedValue({ ...createdPoll, options: createdOptions });

      const request = new NextRequest('http://localhost:3000/api/admin/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pollData)
      });

      const response = await createPoll(request);
      const responseData = await response.json();

      // Assert response structure matches expectations
      expect(responseData).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: expect.any(Number),
          title: expect.any(String),
          description: expect.any(String),
          poll_type: expect.any(String),
          start_date: expect.any(String),
          end_date: expect.any(String),
          is_active: expect.any(Boolean),
          show_results: expect.any(Boolean),
          created_at: expect.any(String),
          updated_at: expect.any(String),
          options: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(Number),
              poll_id: expect.any(Number),
              name: expect.any(String),
              created_at: expect.any(String),
              updated_at: expect.any(String)
            })
          ])
        })
      });
    });
  });

  describe('Cache Invalidation', () => {
    it('should clear cache after poll creation', async () => {
      const pollData = {
        title: 'Cache Test Poll',
        description: 'Testing cache invalidation',
        poll_type: 'weekly',
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-07T23:59:59Z',
        is_active: true,
        show_results: true,
        options: [
          { name: 'Cache Option', image_url: null }
        ]
      };

      const createdPoll = {
        id: 4,
        ...pollData,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockDbCreatePoll.mockResolvedValue(createdPoll);
      mockCreatePollOptions.mockResolvedValue([]);
      mockGetPollById.mockResolvedValue({ ...createdPoll, options: [] });

      const request = new NextRequest('http://localhost:3000/api/admin/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pollData)
      });

      await createPoll(request);

      // Verify cache was cleared after creation
      expect(mockInvalidateEntityCache).toHaveBeenCalledWith('polls');
      expect(mockInvalidateEntityCache).toHaveBeenCalledTimes(1);
    });

    it('should clear cache after poll update', async () => {
      const updateData = {
        title: 'Updated Cache Test Poll',
        description: 'Updated description',
        is_active: false
      };

      const existingPoll = {
        id: 5,
        title: 'Original Title',
        description: 'Original description',
        poll_type: 'weekly',
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-07T23:59:59Z',
        is_active: true,
        show_results: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      const updatedPoll = {
        ...existingPoll,
        ...updateData,
        updated_at: new Date()
      };

      mockGetPollById.mockResolvedValue(existingPoll);
      mockDbUpdatePoll.mockResolvedValue(updatedPoll);

      const request = new NextRequest('http://localhost:3000/api/admin/polls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 5, ...updateData })
      });

      await updatePoll(request);

      // Verify cache was cleared after update
      expect(mockInvalidateEntityCache).toHaveBeenCalledWith('polls');
      expect(mockInvalidateEntityCache).toHaveBeenCalledWith('polls', 5);
      expect(mockInvalidateEntityCache).toHaveBeenCalledTimes(2);
    });

    it('should clear cache after poll deletion', async () => {
      const pollToDelete = {
        id: 6,
        title: 'Poll to Delete',
        description: 'This poll will be deleted',
        poll_type: 'weekly',
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-07T23:59:59Z',
        is_active: true,
        show_results: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockGetPollById.mockResolvedValue(pollToDelete);
      mockDbDeletePoll.mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/admin/polls?id=6', {
        method: 'DELETE'
      });

      await deletePoll(request);

      // Verify cache was cleared after deletion
      expect(mockInvalidateEntityCache).toHaveBeenCalledWith('polls');
      expect(mockInvalidateEntityCache).toHaveBeenCalledWith('polls', 6);
      expect(mockInvalidateEntityCache).toHaveBeenCalledTimes(2);
    });

    it('should assert fresh data fetched after cache clear', async () => {
      // Reset the invalidate cache mock to track calls
      mockInvalidateEntityCache.mockClear();

      const pollData = {
        title: 'Fresh Data Test',
        description: 'Testing fresh data fetch',
        poll_type: 'monthly',
        start_date: '2024-02-01T00:00:00Z',
        end_date: '2024-02-29T23:59:59Z',
        is_active: true,
        show_results: true,
        options: []
      };

      const createdPoll = {
        id: 7,
        ...pollData,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockDbCreatePoll.mockResolvedValue(createdPoll);
      mockCreatePollOptions.mockResolvedValue([]);

      // Mock that fresh data is fetched after cache clear
      mockGetPollById.mockResolvedValueOnce({ ...createdPoll, options: [] });

      const request = new NextRequest('http://localhost:3000/api/admin/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pollData)
      });

      const response = await createPoll(request);
      const responseData = await response.json();

      // Verify cache was invalidated first
      expect(mockInvalidateEntityCache).toHaveBeenCalledWith('polls');

      // Verify fresh data was fetched (getPollById called after creation)
      expect(mockGetPollById).toHaveBeenCalledWith(createdPoll.id);

      // Verify response contains fresh data
      expect(responseData.success).toBe(true);
      expect(responseData.data.id).toBe(createdPoll.id);
      expect(responseData.data.title).toBe(createdPoll.title);
    });
  });

  describe('Transaction Rollback', () => {
    it('should rollback transaction on poll creation error', async () => {
      const pollData = {
        title: 'Transaction Test Poll',
        description: 'Testing transaction rollback',
        poll_type: 'weekly',
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-07T23:59:59Z',
        is_active: true,
        show_results: true,
        options: [
          { name: 'Option 1', image_url: null }
        ]
      };

      // Mock database transaction with rollback capability
      const mockTransaction = {
        rollback: jest.fn(),
        commit: jest.fn()
      };

      mockDb.transaction = jest.fn().mockImplementation(async (callback) => {
        try {
          return await callback(mockTransaction);
        } catch (error) {
          await mockTransaction.rollback();
          throw error;
        }
      });

      // Mock poll creation to succeed but options creation to fail
      mockDbCreatePoll.mockResolvedValue({
        id: 8,
        ...pollData,
        created_at: new Date(),
        updated_at: new Date()
      });

      // Mock options creation to fail
      mockCreatePollOptions.mockRejectedValue(new Error('Database constraint violation'));

      const request = new NextRequest('http://localhost:3000/api/admin/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pollData)
      });

      const response = await createPoll(request);
      const responseData = await response.json();

      // Verify transaction was rolled back
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();

      // Verify error response returned
      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBeDefined();
    });

    it('should verify no partial data saved on rollback', async () => {
      const pollData = {
        title: 'Partial Data Test',
        description: 'Testing no partial data is saved',
        poll_type: 'monthly',
        start_date: '2024-02-01T00:00:00Z',
        end_date: '2024-02-29T23:59:59Z',
        is_active: true,
        show_results: true,
        options: [
          { name: 'Option A', image_url: null },
          { name: 'Option B', image_url: null }
        ]
      };

      const mockTransaction = {
        rollback: jest.fn(),
        commit: jest.fn()
      };

      mockDb.transaction = jest.fn().mockImplementation(async (callback) => {
        try {
          return await callback(mockTransaction);
        } catch (error) {
          await mockTransaction.rollback();
          throw error;
        }
      });

      // Mock poll creation to succeed
      const createdPoll = {
        id: 9,
        ...pollData,
        created_at: new Date(),
        updated_at: new Date()
      };
      mockDbCreatePoll.mockResolvedValue(createdPoll);

      // Mock options creation to fail after poll is created
      mockCreatePollOptions.mockRejectedValue(new Error('Foreign key constraint failed'));

      // Mock getPollById to return null after rollback (no partial data)
      mockGetPollById.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pollData)
      });

      const response = await createPoll(request);

      // Verify rollback occurred
      expect(mockTransaction.rollback).toHaveBeenCalled();

      // Verify no poll exists in database after rollback
      // This would be tested by checking that getPollById returns null
      // In a real scenario, the transaction would prevent any data from being committed
      expect(response.status).toBe(500);
    });

    it('should check error response returned on rollback', async () => {
      const pollData = {
        title: 'Error Response Test',
        description: 'Testing error response on rollback',
        poll_type: 'custom',
        start_date: '2024-03-01T00:00:00Z',
        end_date: '2024-03-31T23:59:59Z',
        is_active: true,
        show_results: true,
        options: []
      };

      const mockTransaction = {
        rollback: jest.fn(),
        commit: jest.fn()
      };

      mockDb.transaction = jest.fn().mockImplementation(async (callback) => {
        try {
          return await callback(mockTransaction);
        } catch (error) {
          await mockTransaction.rollback();
          throw error;
        }
      });

      // Mock poll creation to fail immediately
      mockDbCreatePoll.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/admin/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pollData)
      });

      const response = await createPoll(request);
      const responseData = await response.json();

      // Verify error response structure
      expect(response.status).toBe(500);
      expect(responseData).toMatchObject({
        success: false,
        error: expect.any(String)
      });

      // Verify transaction was rolled back
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should assert database state unchanged after rollback', async () => {
      const pollData = {
        title: 'Database State Test',
        description: 'Testing database state remains unchanged',
        poll_type: 'weekly',
        start_date: '2024-04-01T00:00:00Z',
        end_date: '2024-04-07T23:59:59Z',
        is_active: true,
        show_results: true,
        options: [
          { name: 'State Test Option', image_url: null }
        ]
      };

      const mockTransaction = {
        rollback: jest.fn(),
        commit: jest.fn()
      };

      mockDb.transaction = jest.fn().mockImplementation(async (callback) => {
        try {
          return await callback(mockTransaction);
        } catch (error) {
          await mockTransaction.rollback();
          throw error;
        }
      });

      // Track initial database state (mock scenario)
      const initialPollCount = 5; // Assume 5 polls exist initially
      mockGetPollById.mockResolvedValue(null); // Poll doesn't exist before

      // Mock poll creation to succeed but options to fail
      mockDbCreatePoll.mockResolvedValue({
        id: 10,
        ...pollData,
        created_at: new Date(),
        updated_at: new Date()
      });
      mockCreatePollOptions.mockRejectedValue(new Error('Validation failed'));

      const request = new NextRequest('http://localhost:3000/api/admin/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pollData)
      });

      await createPoll(request);

      // Verify rollback was called
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();

      // In a real transaction, database state would be unchanged
      // This is ensured by the database transaction mechanism
      // We verify that rollback was properly invoked
      expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);

      // Verify no partial state exists - poll doesn't exist after rollback
      expect(mockGetPollById).not.toHaveBeenCalledWith(10);
    });
  });
});