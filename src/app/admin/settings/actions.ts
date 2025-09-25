'use server'

/**
 * Server Actions for Admin Settings
 * Handles secure form submission for radio stream URL configuration
 *
 * Requirements: 1.4, 1.5, 6.5, 7.7
 * - Server-side validation and authentication for stream URL updates
 * - Super admin role verification for critical configuration changes
 * - Integration with existing error handling and database systems
 * - Real-time event broadcasting for configuration updates
 */

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth/config'
import { StreamUrlValidator } from '@/lib/utils/streamUrlValidator'
import { RadioErrorHandler, RadioErrorType } from '@/lib/utils/radioErrorHandler'
import { updateStreamUrlAtomic } from '@/lib/db/queries/radioSettings'
import { broadcastSettingsUpdate } from '@/lib/utils/radioEvents'
import { invalidateEntityCache } from '@/lib/cache/invalidation'
import { StreamConfigurationData } from '@/types/radioSettings'

/**
 * Server action response format
 * Standardized response structure for client-side handling
 */
export interface ActionResponse<T = any> {
  /** Whether the action was successful */
  success: boolean;
  /** Success or error message */
  message: string;
  /** Optional data payload for successful operations */
  data?: T;
  /** Error details for failed operations */
  error?: {
    /** Error type classification */
    type: string;
    /** Error code for programmatic handling */
    code: string;
    /** User-friendly error message */
    userMessage: string;
    /** Technical details for debugging */
    details?: any;
    /** Whether the operation can be retried */
    isRetryable: boolean;
  };
}

/**
 * Form data interface for stream URL updates
 * Mirrors the form structure from the admin settings page
 */
export interface UpdateStreamUrlFormData {
  /** Primary stream URL */
  stream_url: string;
  /** Optional metadata URL for stream information */
  metadata_url?: string;
  /** Radio station name */
  station_name: string;
  /** Optional station description */
  station_description?: string;
  /** Social media URLs */
  facebook_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  youtube_url?: string;
}

/**
 * Validates authentication and super admin permissions
 * Requirement 1.5: Authentication check for super_admin role
 */
async function validateSuperAdminAccess(): Promise<{
  success: boolean;
  user?: any;
  error?: ReturnType<typeof RadioErrorHandler.toApiResponse>;
}> {
  try {
    // Check authentication
    const session = await auth()

    if (!session || !session.user?.email) {
      const authError = RadioErrorHandler.handleAuthError(
        'No valid session found',
        'updateStreamUrl',
        { requiredRole: 'super_admin' }
      )

      return {
        success: false,
        error: RadioErrorHandler.toApiResponse(authError)
      }
    }

    // Verify super admin role
    const userRole = session.user?.role
    if (!userRole || userRole !== 'super_admin') {
      const authError = RadioErrorHandler.handleAuthError(
        'Super admin access required for stream URL modifications',
        'updateStreamUrl',
        {
          adminUserId: session.user?.id ? parseInt(session.user.id) : undefined,
          adminUserEmail: session.user?.email,
          requiredRole: 'super_admin'
        }
      )

      return {
        success: false,
        error: RadioErrorHandler.toApiResponse(authError)
      }
    }

    return {
      success: true,
      user: session.user
    }
  } catch (error) {
    const unknownError = RadioErrorHandler.analyzeError(
      error,
      'validateSuperAdminAccess'
    )

    return {
      success: false,
      error: RadioErrorHandler.toApiResponse(unknownError)
    }
  }
}

/**
 * Validates form data using StreamUrlValidator service
 * Requirement 1.4: Include proper error handling and success response formatting
 */
function validateFormData(formData: UpdateStreamUrlFormData): {
  success: boolean;
  error?: ReturnType<typeof RadioErrorHandler.toApiResponse>;
} {
  try {
    // Validate required stream URL
    if (!formData.stream_url || formData.stream_url.trim().length === 0) {
      const validationError = RadioErrorHandler.handleFormValidationError(
        'Stream URL is required',
        'validateFormData',
        {
          fieldName: 'stream_url',
          fieldValue: formData.stream_url
        }
      )

      return {
        success: false,
        error: RadioErrorHandler.toApiResponse(validationError)
      }
    }

    // Validate stream URL format using StreamUrlValidator
    const validator = new StreamUrlValidator()
    const urlValidation = validator.validateUrl(formData.stream_url.trim())

    if (!urlValidation.isValid) {
      const validationError = RadioErrorHandler.handleStreamValidationError(
        urlValidation.message,
        'validateFormData',
        {
          streamUrl: formData.stream_url
        }
      )

      return {
        success: false,
        error: RadioErrorHandler.toApiResponse(validationError)
      }
    }

    // Validate required station name
    if (!formData.station_name || formData.station_name.trim().length === 0) {
      const validationError = RadioErrorHandler.handleFormValidationError(
        'Station name is required',
        'validateFormData',
        {
          fieldName: 'station_name',
          fieldValue: formData.station_name
        }
      )

      return {
        success: false,
        error: RadioErrorHandler.toApiResponse(validationError)
      }
    }

    // Validate station name length
    if (formData.station_name.length > 255) {
      const validationError = RadioErrorHandler.handleFormValidationError(
        'Station name cannot exceed 255 characters',
        'validateFormData',
        {
          fieldName: 'station_name',
          fieldValue: formData.station_name
        }
      )

      return {
        success: false,
        error: RadioErrorHandler.toApiResponse(validationError)
      }
    }

    // Validate station description length if provided
    if (formData.station_description && formData.station_description.length > 65535) {
      const validationError = RadioErrorHandler.handleFormValidationError(
        'Station description cannot exceed 65535 characters',
        'validateFormData',
        {
          fieldName: 'station_description',
          fieldValue: formData.station_description
        }
      )

      return {
        success: false,
        error: RadioErrorHandler.toApiResponse(validationError)
      }
    }

    // Validate social media URLs if provided
    const socialUrls = [
      { key: 'facebook_url', value: formData.facebook_url },
      { key: 'twitter_url', value: formData.twitter_url },
      { key: 'instagram_url', value: formData.instagram_url },
      { key: 'youtube_url', value: formData.youtube_url }
    ]

    for (const { key, value } of socialUrls) {
      if (value && value.trim().length > 0) {
        try {
          new URL(value.trim())
          if (value.length > 500) {
            const validationError = RadioErrorHandler.handleFormValidationError(
              `${key.replace('_url', '')} URL cannot exceed 500 characters`,
              'validateFormData',
              {
                fieldName: key,
                fieldValue: value
              }
            )

            return {
              success: false,
              error: RadioErrorHandler.toApiResponse(validationError)
            }
          }
        } catch {
          const validationError = RadioErrorHandler.handleFormValidationError(
            `Invalid ${key.replace('_url', '')} URL format`,
            'validateFormData',
            {
              fieldName: key,
              fieldValue: value
            }
          )

          return {
            success: false,
            error: RadioErrorHandler.toApiResponse(validationError)
          }
        }
      }
    }

    // Validate metadata URL if provided
    if (formData.metadata_url && formData.metadata_url.trim().length > 0) {
      const metadataUrlValidation = validator.validateUrl(formData.metadata_url.trim())
      if (!metadataUrlValidation.isValid) {
        const validationError = RadioErrorHandler.handleStreamValidationError(
          `Invalid metadata URL: ${metadataUrlValidation.message}`,
          'validateFormData',
          {
            streamUrl: formData.metadata_url
          }
        )

        return {
          success: false,
          error: RadioErrorHandler.toApiResponse(validationError)
        }
      }
    }

    return { success: true }
  } catch (error) {
    const unknownError = RadioErrorHandler.analyzeError(
      error,
      'validateFormData'
    )

    return {
      success: false,
      error: RadioErrorHandler.toApiResponse(unknownError)
    }
  }
}

/**
 * Updates stream URL configuration atomically with database transaction
 * Integrates with existing updateStreamUrlAtomic database method
 */
async function updateStreamConfiguration(
  formData: UpdateStreamUrlFormData,
  adminUserId: number
): Promise<{
  success: boolean;
  data?: StreamConfigurationData;
  error?: ReturnType<typeof RadioErrorHandler.toApiResponse>;
}> {
  try {
    // Prepare configuration data for atomic update
    const streamConfigData = {
      stream_url: formData.stream_url.trim(),
      metadata_url: formData.metadata_url?.trim() || null,
      station_name: formData.station_name.trim(),
      station_description: formData.station_description?.trim() || null,
      facebook_url: formData.facebook_url?.trim() || null,
      twitter_url: formData.twitter_url?.trim() || null,
      instagram_url: formData.instagram_url?.trim() || null,
      youtube_url: formData.youtube_url?.trim() || null,
      is_active: true,
      updated_by: adminUserId
    }

    // Use existing atomic database update method
    const updatedConfiguration = await updateStreamUrlAtomic(
      streamConfigData,
      adminUserId
    )

    return {
      success: true,
      data: updatedConfiguration
    }
  } catch (error) {
    // Handle database errors with specific error handler
    const dbError = RadioErrorHandler.handleDatabaseError(
      error as Error,
      'updateStreamConfiguration',
      {
        adminUserId: adminUserId,
        table: 'radio_settings'
      }
    )

    return {
      success: false,
      error: RadioErrorHandler.toApiResponse(dbError)
    }
  }
}

/**
 * Main server action: Update Stream URL Configuration
 *
 * Secure server-side form submission handler for radio stream URL updates
 * Requirements: 1.4, 1.5, 6.5, 7.7
 *
 * @param formData - Form data from admin settings page
 * @returns ActionResponse with success/error status and data
 */
export async function updateStreamUrl(
  formData: FormData
): Promise<ActionResponse<StreamConfigurationData>> {
  const operationId = `updateStreamUrl_${Date.now()}`

  try {
    // Step 1: Validate super admin authentication
    const authValidation = await validateSuperAdminAccess()
    if (!authValidation.success) {
      return {
        success: false,
        message: authValidation.error?.error.message || 'Authentication failed',
        error: authValidation.error ? {
          type: authValidation.error.error.type,
          code: authValidation.error.error.code,
          userMessage: authValidation.error.error.message,
          details: authValidation.error.error.details,
          isRetryable: authValidation.error.error.details?.isRetryable || false
        } : undefined
      }
    }

    const adminUser = authValidation.user!
    const adminUserId = parseInt(adminUser.id)

    // Step 2: Extract and validate form data
    const formDataObj: UpdateStreamUrlFormData = {
      stream_url: formData.get('stream_url') as string,
      metadata_url: formData.get('metadata_url') as string || undefined,
      station_name: formData.get('station_name') as string,
      station_description: formData.get('station_description') as string || undefined,
      facebook_url: formData.get('facebook_url') as string || undefined,
      twitter_url: formData.get('twitter_url') as string || undefined,
      instagram_url: formData.get('instagram_url') as string || undefined,
      youtube_url: formData.get('youtube_url') as string || undefined
    }

    const validation = validateFormData(formDataObj)
    if (!validation.success) {
      return {
        success: false,
        message: validation.error?.error.message || 'Form validation failed',
        error: validation.error ? {
          type: validation.error.error.type,
          code: validation.error.error.code,
          userMessage: validation.error.error.message,
          details: validation.error.error.details,
          isRetryable: validation.error.error.details?.isRetryable || false
        } : undefined
      }
    }

    // Step 3: Update stream configuration atomically
    const updateResult = await updateStreamConfiguration(formDataObj, adminUserId)
    if (!updateResult.success) {
      return {
        success: false,
        message: updateResult.error?.error.message || 'Database update failed',
        error: updateResult.error ? {
          type: updateResult.error.error.type,
          code: updateResult.error.error.code,
          userMessage: updateResult.error.error.message,
          details: updateResult.error.error.details,
          isRetryable: updateResult.error.error.details?.isRetryable || false
        } : undefined
      }
    }

    const updatedConfiguration = updateResult.data!

    // Step 4: Invalidate cache and trigger real-time updates
    try {
      // Invalidate radio settings cache
      await invalidateEntityCache('radio')

      // Broadcast real-time events using existing radioEvents system
      // This will notify any listening radio players about the configuration change
      if (typeof window !== 'undefined') {
        broadcastSettingsUpdate(
          {
            id: updatedConfiguration.id,
            stream_url: updatedConfiguration.stream_url,
            metadata_url: updatedConfiguration.metadata_url,
            station_name: updatedConfiguration.station_name,
            station_description: updatedConfiguration.station_description,
            facebook_url: updatedConfiguration.facebook_url,
            twitter_url: updatedConfiguration.twitter_url,
            instagram_url: updatedConfiguration.instagram_url,
            youtube_url: updatedConfiguration.youtube_url
          },
          [
            'stream_url',
            'metadata_url',
            'station_name',
            'station_description',
            'facebook_url',
            'twitter_url',
            'instagram_url',
            'youtube_url'
          ],
          {
            source: 'admin-settings-action',
            correlationId: operationId,
            debug: process.env.NODE_ENV === 'development'
          }
        )
      }

      // Revalidate admin settings page
      revalidatePath('/admin/settings')
      revalidatePath('/admin/settings/radio')
    } catch (cacheError) {
      // Cache/event errors shouldn't fail the main operation
      console.warn('Cache invalidation or event broadcasting failed:', cacheError)
    }

    return {
      success: true,
      message: 'Radyo ayarları başarıyla güncellendi', // Turkish: Radio settings updated successfully
      data: updatedConfiguration
    }

  } catch (error) {
    // Handle any unexpected errors
    const unknownError = RadioErrorHandler.analyzeError(
      error,
      'updateStreamUrl'
    )

    return {
      success: false,
      message: unknownError.userMessage,
      error: {
        type: unknownError.type,
        code: unknownError.type,
        userMessage: unknownError.userMessage,
        details: unknownError.context,
        isRetryable: unknownError.isRetryable
      }
    }
  }
}

/**
 * Server action: Test Stream URL Connection
 *
 * Validates and tests stream URL connectivity before saving configuration
 * Uses existing stream testing infrastructure from radioSettings queries
 *
 * @param streamUrl - Stream URL to test
 * @returns ActionResponse with test results
 */
export async function testStreamConnection(
  streamUrl: string
): Promise<ActionResponse<{ isValid: boolean; message: string; details?: any }>> {
  try {
    // Validate super admin authentication
    const authValidation = await validateSuperAdminAccess()
    if (!authValidation.success) {
      return {
        success: false,
        message: authValidation.error?.error.message || 'Authentication failed',
        error: authValidation.error ? {
          type: authValidation.error.error.type,
          code: authValidation.error.error.code,
          userMessage: authValidation.error.error.message,
          details: authValidation.error.error.details,
          isRetryable: authValidation.error.error.details?.isRetryable || false
        } : undefined
      }
    }

    // Validate URL format first
    const validator = new StreamUrlValidator()
    const urlValidation = validator.validateUrl(streamUrl)

    if (!urlValidation.isValid) {
      return {
        success: false,
        message: 'URL format validation failed',
        data: {
          isValid: false,
          message: urlValidation.message,
          details: urlValidation.details
        }
      }
    }

    // Import and use the existing stream connection test
    const { testStreamConnection: testConnection } = await import('@/lib/db/queries/radioSettings')
    const testResult = await testConnection(streamUrl)

    return {
      success: true,
      message: testResult.isValid ? 'Stream bağlantısı başarılı' : 'Stream bağlantısı başarısız', // Turkish
      data: {
        isValid: testResult.isValid,
        message: testResult.error || 'Stream connection successful',
        details: {
          statusCode: testResult.statusCode,
          responseTime: testResult.responseTime,
          contentType: testResult.contentType
        }
      }
    }

  } catch (error) {
    const connectionError = RadioErrorHandler.handleStreamConnectionError(
      error,
      'testStreamConnection',
      {
        streamUrl: streamUrl
      }
    )

    return {
      success: false,
      message: connectionError.userMessage,
      data: {
        isValid: false,
        message: connectionError.userMessage,
        details: connectionError.context
      },
      error: {
        type: connectionError.type,
        code: connectionError.type,
        userMessage: connectionError.userMessage,
        details: connectionError.context,
        isRetryable: connectionError.isRetryable
      }
    }
  }
}