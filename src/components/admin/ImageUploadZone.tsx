'use client';

import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FiUpload, FiImage, FiX } from 'react-icons/fi';

interface ImageUploadZoneProps {
  onUpload: (files: File[]) => void;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  multiple?: boolean;
}

export function ImageUploadZone({
  onUpload,
  maxSize = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  multiple = true
}: ImageUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `${file.name}: Desteklenmeyen dosya tipi`;
    }
    if (file.size > maxSize * 1024 * 1024) {
      return `${file.name}: Dosya boyutu ${maxSize}MB sınırını aşıyor`;
    }
    return null;
  };

  const handleFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validationErrors: string[] = [];
    const validFiles: File[] = [];

    fileArray.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        validationErrors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    setErrors(validationErrors);
    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const { files } = e.dataTransfer;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      onUpload(selectedFiles);
      setSelectedFiles([]);
      setErrors([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 transition-all duration-200',
          isDragOver
            ? 'border-brand-red-600 bg-brand-red-600/10'
            : 'border-dark-border-secondary hover:border-dark-border-primary'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="text-center">
          <FiUpload className="w-12 h-12 mx-auto mb-4 text-dark-text-tertiary" />
          <p className="text-dark-text-primary mb-2">
            Dosyaları sürükleyip bırakın
          </p>
          <p className="text-sm text-dark-text-secondary mb-4">
            veya
          </p>
          <Button
            type="button"
            variant="secondary"
            size="medium"
            onClick={() => fileInputRef.current?.click()}
          >
            <FiImage className="w-4 h-4 mr-2" />
            Dosya Seç
          </Button>
          <p className="text-xs text-dark-text-tertiary mt-4">
            Maksimum dosya boyutu: {maxSize}MB • Desteklenen formatlar: JPEG, PNG, GIF, WebP
          </p>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="p-3 bg-red-900/20 border border-red-900 rounded-lg">
          {errors.map((error, index) => (
            <p key={index} className="text-red-400 text-sm">
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-dark-text-secondary">
            Seçilen Dosyalar ({selectedFiles.length})
          </p>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-dark-surface-secondary rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FiImage className="w-4 h-4 text-dark-text-tertiary" />
                  <div>
                    <p className="text-sm text-dark-text-primary">
                      {file.name}
                    </p>
                    <p className="text-xs text-dark-text-tertiary">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-dark-surface-tertiary rounded transition-colors"
                >
                  <FiX className="w-4 h-4 text-dark-text-secondary" />
                </button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="default"
            size="medium"
            fullWidth
            onClick={handleUpload}
          >
            <FiUpload className="w-4 h-4 mr-2" />
            {selectedFiles.length} Dosyayı Yükle
          </Button>
        </div>
      )}
    </div>
  );
}