/**
 * Mobile Poll Service
 * Handles poll data retrieval and voting logic for mobile endpoints
 * Requirements: 1.1, 1.2, 3.2 - Mobile poll endpoints with settings support
 */

import type {
  MobilePoll,
  MobilePollItem,
  MobileSettings,
  DeviceInfo,
  VoteResult
} from '@/types/mobile';
import { getActivePolls, hasVoted, recordVote, getPollById, getPollItems } from '@/lib/db/polls';
import { db } from '@/lib/db/client';
import { fixMediaUrlsInObject } from '@/lib/utils/url-fixer';

export class PollService {
  /**
   * Get active poll(s) based on mobile settings
   * Applies showOnlyLastActivePoll setting to filter results
   *
   * @param settings Mobile app settings
   * @returns Active poll or null if none found
   */
  async getActivePoll(settings: MobileSettings): Promise<MobilePoll | null> {
    try {
      // Check if polls are enabled
      if (!settings.enablePolls) {
        return null;
      }

      // Get active polls from database
      const polls = await getActivePolls();

      if (!polls || polls.length === 0) {
        return null;
      }

      // Apply setting to show only last active poll
      const selectedPoll = settings.showOnlyLastActivePoll
        ? polls[polls.length - 1] // Get the most recent active poll
        : polls[0]; // Get the first active poll

      // Transform to mobile format
      return this.transformToMobilePoll(selectedPoll);
    } catch (error) {
      console.error('Error getting active poll:', error);
      throw new Error('Failed to retrieve active poll');
    }
  }

  /**
   * Submit a vote for a poll item
   * Validates device and prevents duplicate voting
   *
   * @param pollId Poll ID
   * @param itemId Poll item ID
   * @param deviceInfo Device information for tracking
   * @param ipAddress IP address from request
   * @returns Vote result with updated counts
   */
  async submitVote(
    pollId: number,
    itemId: number,
    deviceInfo: DeviceInfo,
    ipAddress: string
  ): Promise<VoteResult> {
    try {
      // Check if device has already voted
      const alreadyVoted = await hasVoted(
        pollId,
        deviceInfo.deviceId,
        ipAddress
      );

      if (alreadyVoted) {
        return {
          success: false,
          message: 'Bu ankette zaten oy kullandınız'
        };
      }

      // Record the vote
      const success = await recordVote({
        pollId,
        pollItemId: itemId,
        deviceId: deviceInfo.deviceId,
        ipAddress,
        userAgent: deviceInfo.userAgent || 'mobile-app'
      });

      if (!success) {
        return {
          success: false,
          message: 'Oy kaydedilemedi. Lütfen tekrar deneyin.'
        };
      }

      // Get updated poll results
      const updatedPoll = await getPollById(pollId);
      const pollItems = updatedPoll ? await getPollItems(pollId) : [];

      if (!updatedPoll) {
        return {
          success: true,
          message: 'Oyunuz kaydedildi'
        };
      }

      // Calculate percentages and return updated counts
      const totalVotes = pollItems.reduce(
        (sum: number, item: any) => sum + (item.vote_count || 0),
        0
      );

      const updatedCounts = pollItems.map((item: any) => ({
        itemId: item.id,
        voteCount: item.vote_count || 0,
        percentage: totalVotes > 0
          ? Math.round((item.vote_count || 0) / totalVotes * 100)
          : 0
      }));

      return {
        success: true,
        message: 'Oyunuz başarıyla kaydedildi',
        updatedCounts
      };
    } catch (error) {
      console.error('Error submitting vote:', error);
      return {
        success: false,
        message: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
      };
    }
  }

  /**
   * Transform database poll to mobile format
   * Applies URL fixing and calculates additional fields
   *
   * @param poll Database poll object
   * @returns Formatted mobile poll
   */
  private transformToMobilePoll(poll: any): MobilePoll {
    // Calculate total votes
    const totalVotes = poll.items?.reduce(
      (sum: number, item: any) => sum + (item.vote_count || 0),
      0
    ) || 0;

    // Calculate time remaining
    const endDate = new Date(poll.end_date);
    const now = new Date();
    const timeDiff = endDate.getTime() - now.getTime();
    const daysRemaining = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    let timeRemaining = '';
    if (timeDiff > 0) {
      if (daysRemaining > 0) {
        timeRemaining = `${daysRemaining} gün ${hoursRemaining} saat kaldı`;
      } else if (hoursRemaining > 0) {
        timeRemaining = `${hoursRemaining} saat kaldı`;
      } else {
        const minutesRemaining = Math.floor(timeDiff / (1000 * 60));
        timeRemaining = `${minutesRemaining} dakika kaldı`;
      }
    } else {
      timeRemaining = 'Anket sona erdi';
    }

    // Transform items
    const items: MobilePollItem[] = (poll.items || []).map((item: any) => {
      const percentage = totalVotes > 0
        ? Math.round((item.vote_count || 0) / totalVotes * 100)
        : 0;

      return fixMediaUrlsInObject({
        id: item.id,
        title: item.title,
        description: item.description,
        imageUrl: item.image_url,
        voteCount: poll.show_results === 'always' || poll.show_results === 'after_voting'
          ? item.vote_count || 0
          : 0,
        percentage: poll.show_results === 'always' || poll.show_results === 'after_voting'
          ? percentage
          : 0,
        displayOrder: item.display_order || 0
      });
    });

    // Sort items by display order
    items.sort((a, b) => a.displayOrder - b.displayOrder);

    return fixMediaUrlsInObject({
      id: poll.id,
      title: poll.title,
      description: poll.description,
      pollType: poll.poll_type || 'custom',
      startDate: poll.start_date,
      endDate: poll.end_date,
      isActive: poll.is_active || false,
      items,
      totalVotes,
      timeRemaining
    });
  }

  /**
   * Get current/latest active poll
   * @param deviceId Device ID to check vote status
   * @returns Current active poll with vote status
   */
  async getCurrentPoll(deviceId: string): Promise<MobilePoll | null> {
    try {
      const polls = await getActivePolls();

      if (!polls || polls.length === 0) {
        return null;
      }

      // Get the most recent active poll
      const currentPoll = polls[0];

      // Check if user has voted
      const hasVoted = deviceId ? await this.hasUserVoted(currentPoll.id, deviceId) : false;

      // Get poll items
      const items = await getPollItems(currentPoll.id);

      // Transform to mobile format
      const mobilePoll = this.transformToMobilePoll(currentPoll);
      return mobilePoll;
    } catch (error) {
      console.error('Error getting current poll:', error);
      return null;
    }
  }

  /**
   * Get multiple active polls (for future use)
   * Returns all active polls without filtering
   *
   * @returns Array of active polls
   */
  async getActivePolls(): Promise<MobilePoll[]> {
    try {
      const polls = await getActivePolls();
      return polls.map((poll: any) => this.transformToMobilePoll(poll));
    } catch (error) {
      console.error('Error getting active polls:', error);
      throw new Error('Failed to retrieve active polls');
    }
  }

  /**
   * Check if a user has voted (device ID only)
   * @param pollId Poll ID
   * @param deviceId Device identifier
   * @returns True if already voted
   */
  async hasUserVoted(pollId: number, deviceId: string): Promise<boolean> {
    try {
      return await hasVoted(pollId, deviceId, '');
    } catch (error) {
      console.error('Error checking vote status:', error);
      return false;
    }
  }

  /**
   * Check if a user has voted in a poll
   *
   * @param pollId Poll ID
   * @param deviceId Device identifier
   * @param ipAddress IP address
   * @returns True if already voted
   */
  async checkHasVoted(
    pollId: number,
    deviceId: string,
    ipAddress: string
  ): Promise<boolean> {
    try {
      return await hasVoted(pollId, deviceId, ipAddress);
    } catch (error) {
      console.error('Error checking vote status:', error);
      return false;
    }
  }
}

// Export singleton instance
const pollService = new PollService();
export default pollService;