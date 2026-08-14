import React from 'react';

export type ImageUploadValue = string | string[];
export type ImageUploadOnChange = (url: ImageUploadValue | ((prev: ImageUploadValue) => ImageUploadValue)) => void;

export interface ImageUploadProps {
  value?: string | string[];
  onChange: ImageUploadOnChange;
  onPathChange?: (path: string) => void;
  onMainImageChange?: (index: number) => void;
  mainImageIndex?: number;
  folder?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showUrlInput?: boolean;
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'auto';
  maxWidth?: number;
  maxHeight?: number;
  multiple?: boolean;
  maxFiles?: number;
  label?: string;
  helperText?: string;
  accept?: string;
  useCloudStorage?: boolean;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
