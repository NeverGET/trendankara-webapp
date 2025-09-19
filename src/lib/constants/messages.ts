/**
 * Turkish message constants for CMS confirmation scenarios
 */

export const CONFIRMATION_MESSAGES = {
  // Delete confirmation messages (Requirement 1.1)
  DELETE_CONFIRM_TITLE: 'İçeriği Sil',
  DELETE_CONFIRM_MESSAGE: 'Bu içeriği silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
  DELETE_CONFIRM_WARNING: 'Uyarı: Bu işlem kalıcıdır ve geri alınamaz.',
  DELETE_CONFIRM_BUTTON: 'Evet, Sil',
  DELETE_CANCEL_BUTTON: 'İptal',

  // Publish confirmation messages (Requirement 1.4)
  PUBLISH_CONFIRM_TITLE: 'İçeriği Yayınla',
  PUBLISH_CONFIRM_MESSAGE: 'Bu içeriği yayınlamak istediğinizden emin misiniz?',
  PUBLISH_CONFIRM_PREVIEW: 'İçerik önizlemesi:',
  PUBLISH_CONFIRM_BUTTON: 'Evet, Yayınla',
  PUBLISH_CANCEL_BUTTON: 'İptal',

  // Unpublish confirmation messages (Requirement 1.4)
  UNPUBLISH_CONFIRM_TITLE: 'İçeriği Yayından Kaldır',
  UNPUBLISH_CONFIRM_MESSAGE: 'Bu içeriği yayından kaldırmak istediğinizden emin misiniz?',
  UNPUBLISH_CONFIRM_PREVIEW: 'İçerik önizlemesi:',
  UNPUBLISH_CONFIRM_BUTTON: 'Evet, Yayından Kaldır',
  UNPUBLISH_CANCEL_BUTTON: 'İptal',
} as const;

export const SUCCESS_MESSAGES = {
  // Success notifications
  DELETE_SUCCESS: 'İçerik başarıyla silindi.',
  PUBLISH_SUCCESS: 'İçerik başarıyla yayınlandı.',
  UNPUBLISH_SUCCESS: 'İçerik başarıyla yayından kaldırıldı.',
  SAVE_SUCCESS: 'Değişiklikler başarıyla kaydedildi.',
  CREATE_SUCCESS: 'Yeni içerik başarıyla oluşturuldu.',
  UPDATE_SUCCESS: 'İçerik başarıyla güncellendi.',
} as const;

export const ERROR_MESSAGES = {
  // Error notifications
  DELETE_ERROR: 'İçerik silinirken bir hata oluştu.',
  PUBLISH_ERROR: 'İçerik yayınlanırken bir hata oluştu.',
  UNPUBLISH_ERROR: 'İçerik yayından kaldırılırken bir hata oluştu.',
  SAVE_ERROR: 'Değişiklikler kaydedilirken bir hata oluştu.',
  CREATE_ERROR: 'İçerik oluşturulurken bir hata oluştu.',
  UPDATE_ERROR: 'İçerik güncellenirken bir hata oluştu.',
  FETCH_ERROR: 'İçerik yüklenirken bir hata oluştu.',
  PERMISSION_ERROR: 'Bu işlem için yetkiniz bulunmuyor.',
  NETWORK_ERROR: 'Ağ bağlantısı hatası. Lütfen tekrar deneyin.',
  UNKNOWN_ERROR: 'Bilinmeyen bir hata oluştu.',
} as const;

export const GENERAL_MESSAGES = {
  // General UI messages
  LOADING: 'Yükleniyor...',
  SAVING: 'Kaydediliyor...',
  DELETING: 'Siliniyor...',
  PUBLISHING: 'Yayınlanıyor...',
  UNPUBLISHING: 'Yayından kaldırılıyor...',
  NO_DATA: 'Veri bulunamadı.',
  CONFIRM: 'Onayla',
  CANCEL: 'İptal',
  SAVE: 'Kaydet',
  EDIT: 'Düzenle',
  DELETE: 'Sil',
  PUBLISH: 'Yayınla',
  UNPUBLISH: 'Yayından Kaldır',
} as const;

// Type definitions for TypeScript support
export type ConfirmationMessage = keyof typeof CONFIRMATION_MESSAGES;
export type SuccessMessage = keyof typeof SUCCESS_MESSAGES;
export type ErrorMessage = keyof typeof ERROR_MESSAGES;
export type GeneralMessage = keyof typeof GENERAL_MESSAGES;