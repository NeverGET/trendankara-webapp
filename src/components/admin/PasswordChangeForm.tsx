'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

interface PasswordChangeFormProps {
  onSuccess?: () => void;
}

export function PasswordChangeForm({ onSuccess }: PasswordChangeFormProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return 'Şifre en az 6 karakter olmalıdır';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');

    // Validation
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Mevcut şifre gereklidir';
    }

    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      newErrors.newPassword = passwordError;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setErrors({ currentPassword: 'Mevcut şifre hatalı' });
        } else {
          setErrors({ general: data.error || 'Şifre değiştirilemedi' });
        }
      } else {
        setSuccessMessage('Şifreniz başarıyla güncellendi');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        onSuccess?.();
      }
    } catch (error) {
      setErrors({ general: 'Bir hata oluştu. Lütfen tekrar deneyin.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="p-3 bg-red-900/20 border border-red-900 rounded-lg text-red-400 text-sm">
          {errors.general}
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-green-900/20 border border-green-900 rounded-lg text-green-400 text-sm">
          {successMessage}
        </div>
      )}

      {/* Current Password */}
      <div>
        <label className="block text-sm font-medium text-dark-text-secondary mb-1">
          Mevcut Şifre
        </label>
        <div className="relative">
          <Input
            type={showPasswords.current ? 'text' : 'password'}
            value={formData.currentPassword}
            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
            placeholder="Mevcut şifrenizi girin"
            error={errors.currentPassword}
          />
          <button
            type="button"
            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-dark-text-secondary hover:text-dark-text-primary"
          >
            {showPasswords.current ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* New Password */}
      <div>
        <label className="block text-sm font-medium text-dark-text-secondary mb-1">
          Yeni Şifre
        </label>
        <div className="relative">
          <Input
            type={showPasswords.new ? 'text' : 'password'}
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            placeholder="Yeni şifrenizi girin"
            error={errors.newPassword}
          />
          <button
            type="button"
            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-dark-text-secondary hover:text-dark-text-primary"
          >
            {showPasswords.new ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-dark-text-tertiary mt-1">
          En az 6 karakter olmalıdır
        </p>
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-dark-text-secondary mb-1">
          Yeni Şifre (Tekrar)
        </label>
        <div className="relative">
          <Input
            type={showPasswords.confirm ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="Yeni şifrenizi tekrar girin"
            error={errors.confirmPassword}
          />
          <button
            type="button"
            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-dark-text-secondary hover:text-dark-text-primary"
          >
            {showPasswords.confirm ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="default"
          size="medium"
          loading={loading}
          fullWidth
        >
          Şifreyi Güncelle
        </Button>
      </div>
    </form>
  );
}