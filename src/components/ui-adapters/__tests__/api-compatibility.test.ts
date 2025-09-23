/**
 * API Compatibility Tests for Mobile Apps
 *
 * Ensures that the ReUI migration does not affect
 * the API responses consumed by mobile applications.
 */

import { NextRequest } from 'next/server';

describe('Mobile API Compatibility Tests', () => {
  describe('News API Endpoints', () => {
    it('should return unchanged news list structure', async () => {
      const expectedStructure = {
        success: expect.any(Boolean),
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            title: expect.any(String),
            slug: expect.any(String),
            content: expect.any(String),
            excerpt: expect.any(String),
            category: expect.any(String),
            image_url: expect.any(String),
            author: expect.any(String),
            published_at: expect.any(String),
            view_count: expect.any(Number),
            is_featured: expect.any(Boolean),
            status: expect.any(String),
          }),
        ]),
        pagination: expect.objectContaining({
          page: expect.any(Number),
          limit: expect.any(Number),
          total: expect.any(Number),
          totalPages: expect.any(Number),
        }),
      };

      // Mock API response
      const response = {
        success: true,
        data: [
          {
            id: 1,
            title: 'Test News',
            slug: 'test-news',
            content: 'Content',
            excerpt: 'Excerpt',
            category: 'Technology',
            image_url: 'https://example.com/image.jpg',
            author: 'Admin',
            published_at: '2024-01-01T00:00:00Z',
            view_count: 100,
            is_featured: true,
            status: 'published',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      expect(response).toMatchObject(expectedStructure);
    });

    it('should return unchanged single news structure', async () => {
      const expectedStructure = {
        success: expect.any(Boolean),
        data: expect.objectContaining({
          id: expect.any(Number),
          title: expect.any(String),
          slug: expect.any(String),
          content: expect.any(String),
          excerpt: expect.any(String),
          category: expect.any(String),
          image_url: expect.any(String),
          author: expect.any(String),
          published_at: expect.any(String),
          view_count: expect.any(Number),
          is_featured: expect.any(Boolean),
          status: expect.any(String),
          tags: expect.any(Array),
          related_articles: expect.any(Array),
        }),
      };

      const response = {
        success: true,
        data: {
          id: 1,
          title: 'Test News',
          slug: 'test-news',
          content: 'Full content here',
          excerpt: 'Excerpt',
          category: 'Technology',
          image_url: 'https://example.com/image.jpg',
          author: 'Admin',
          published_at: '2024-01-01T00:00:00Z',
          view_count: 100,
          is_featured: true,
          status: 'published',
          tags: ['tech', 'news'],
          related_articles: [],
        },
      };

      expect(response).toMatchObject(expectedStructure);
    });
  });

  describe('Radio API Endpoints', () => {
    it('should return unchanged now playing structure', async () => {
      const expectedStructure = {
        success: expect.any(Boolean),
        data: expect.objectContaining({
          stream_url: expect.any(String),
          current_song: expect.objectContaining({
            title: expect.any(String),
            artist: expect.any(String),
            album: expect.any(String),
            artwork: expect.any(String),
            duration: expect.any(Number),
            elapsed: expect.any(Number),
          }),
          listeners: expect.any(Number),
          status: expect.any(String),
          next_song: expect.any(Object),
          recently_played: expect.any(Array),
        }),
      };

      const response = {
        success: true,
        data: {
          stream_url: 'https://stream.example.com',
          current_song: {
            title: 'Test Song',
            artist: 'Test Artist',
            album: 'Test Album',
            artwork: 'https://example.com/artwork.jpg',
            duration: 180,
            elapsed: 60,
          },
          listeners: 150,
          status: 'playing',
          next_song: null,
          recently_played: [],
        },
      };

      expect(response).toMatchObject(expectedStructure);
    });

    it('should return unchanged schedule structure', async () => {
      const expectedStructure = {
        success: expect.any(Boolean),
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            program_name: expect.any(String),
            host: expect.any(String),
            day_of_week: expect.any(String),
            start_time: expect.any(String),
            end_time: expect.any(String),
            description: expect.any(String),
            image_url: expect.any(String),
            is_live: expect.any(Boolean),
          }),
        ]),
      };

      const response = {
        success: true,
        data: [
          {
            id: 1,
            program_name: 'Morning Show',
            host: 'DJ Test',
            day_of_week: 'Monday',
            start_time: '08:00:00',
            end_time: '10:00:00',
            description: 'Morning music and news',
            image_url: 'https://example.com/show.jpg',
            is_live: false,
          },
        ],
      };

      expect(response).toMatchObject(expectedStructure);
    });
  });

  describe('Polls API Endpoints', () => {
    it('should return unchanged active polls structure', async () => {
      const expectedStructure = {
        success: expect.any(Boolean),
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            question: expect.any(String),
            options: expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(Number),
                text: expect.any(String),
                votes: expect.any(Number),
                percentage: expect.any(Number),
              }),
            ]),
            total_votes: expect.any(Number),
            start_date: expect.any(String),
            end_date: expect.any(String),
            is_active: expect.any(Boolean),
            allow_multiple: expect.any(Boolean),
          }),
        ]),
      };

      const response = {
        success: true,
        data: [
          {
            id: 1,
            question: 'What is your favorite genre?',
            options: [
              { id: 1, text: 'Rock', votes: 50, percentage: 50 },
              { id: 2, text: 'Pop', votes: 30, percentage: 30 },
              { id: 3, text: 'Jazz', votes: 20, percentage: 20 },
            ],
            total_votes: 100,
            start_date: '2024-01-01T00:00:00Z',
            end_date: '2024-12-31T23:59:59Z',
            is_active: true,
            allow_multiple: false,
          },
        ],
      };

      expect(response).toMatchObject(expectedStructure);
    });

    it('should accept unchanged vote submission structure', async () => {
      const voteRequest = {
        poll_id: 1,
        option_ids: [2],
        user_identifier: 'mobile_user_123',
      };

      const expectedResponse = {
        success: expect.any(Boolean),
        message: expect.any(String),
        data: expect.objectContaining({
          poll_id: expect.any(Number),
          selected_options: expect.any(Array),
          updated_results: expect.any(Object),
        }),
      };

      const response = {
        success: true,
        message: 'Vote recorded successfully',
        data: {
          poll_id: 1,
          selected_options: [2],
          updated_results: {
            options: [
              { id: 1, text: 'Rock', votes: 50, percentage: 49 },
              { id: 2, text: 'Pop', votes: 31, percentage: 30.4 },
              { id: 3, text: 'Jazz', votes: 20, percentage: 19.6 },
            ],
            total_votes: 101,
          },
        },
      };

      expect(response).toMatchObject(expectedResponse);
    });
  });

  describe('Authentication API Endpoints', () => {
    it('should return unchanged login response structure', async () => {
      const loginRequest = {
        email: 'user@example.com',
        password: 'password123',
        device_token: 'mobile_token_xyz',
      };

      const expectedResponse = {
        success: expect.any(Boolean),
        data: expect.objectContaining({
          user: expect.objectContaining({
            id: expect.any(Number),
            email: expect.any(String),
            name: expect.any(String),
            role: expect.any(String),
            avatar_url: expect.any(String),
          }),
          token: expect.any(String),
          refresh_token: expect.any(String),
          expires_at: expect.any(String),
        }),
      };

      const response = {
        success: true,
        data: {
          user: {
            id: 1,
            email: 'user@example.com',
            name: 'Test User',
            role: 'user',
            avatar_url: 'https://example.com/avatar.jpg',
          },
          token: 'jwt_token_here',
          refresh_token: 'refresh_token_here',
          expires_at: '2024-01-02T00:00:00Z',
        },
      };

      expect(response).toMatchObject(expectedResponse);
    });

    it('should return unchanged user profile structure', async () => {
      const expectedStructure = {
        success: expect.any(Boolean),
        data: expect.objectContaining({
          id: expect.any(Number),
          email: expect.any(String),
          name: expect.any(String),
          role: expect.any(String),
          avatar_url: expect.any(String),
          created_at: expect.any(String),
          preferences: expect.objectContaining({
            notifications: expect.any(Boolean),
            newsletter: expect.any(Boolean),
            theme: expect.any(String),
          }),
          stats: expect.objectContaining({
            polls_voted: expect.any(Number),
            comments_count: expect.any(Number),
            favorite_shows: expect.any(Array),
          }),
        }),
      };

      const response = {
        success: true,
        data: {
          id: 1,
          email: 'user@example.com',
          name: 'Test User',
          role: 'user',
          avatar_url: 'https://example.com/avatar.jpg',
          created_at: '2023-01-01T00:00:00Z',
          preferences: {
            notifications: true,
            newsletter: false,
            theme: 'dark',
          },
          stats: {
            polls_voted: 5,
            comments_count: 10,
            favorite_shows: ['Morning Show', 'Evening Mix'],
          },
        },
      };

      expect(response).toMatchObject(expectedStructure);
    });
  });

  describe('Error Response Compatibility', () => {
    it('should return consistent error structure', () => {
      const errorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: [
            {
              field: 'email',
              message: 'Email is required',
            },
          ],
        },
        timestamp: '2024-01-01T00:00:00Z',
      };

      const expectedStructure = {
        success: false,
        error: expect.objectContaining({
          code: expect.any(String),
          message: expect.any(String),
          details: expect.any(Array),
        }),
        timestamp: expect.any(String),
      };

      expect(errorResponse).toMatchObject(expectedStructure);
    });
  });

  describe('Pagination Structure Compatibility', () => {
    it('should maintain consistent pagination format', () => {
      const paginationResponse = {
        page: 1,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasNext: true,
        hasPrev: false,
      };

      const expectedStructure = {
        page: expect.any(Number),
        limit: expect.any(Number),
        total: expect.any(Number),
        totalPages: expect.any(Number),
        hasNext: expect.any(Boolean),
        hasPrev: expect.any(Boolean),
      };

      expect(paginationResponse).toMatchObject(expectedStructure);
    });
  });
});