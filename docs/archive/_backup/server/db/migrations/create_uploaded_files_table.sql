-- Migration: Create uploaded_files table for serverless image storage
-- This table stores images as base64 data for Netlify Functions compatibility

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.uploaded_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  folder TEXT NOT NULL DEFAULT 'uploads',
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_data TEXT NOT NULL, -- base64 encoded image data
  url_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_uploaded_files_url_path ON public.uploaded_files(url_path);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_folder ON public.uploaded_files(folder);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_created_at ON public.uploaded_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_uploaded_by ON public.uploaded_files(uploaded_by);

-- Add unique constraint on url_path to prevent duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uploaded_files_url_path_unique'
  ) THEN
    ALTER TABLE public.uploaded_files 
    ADD CONSTRAINT uploaded_files_url_path_unique UNIQUE (url_path);
  END IF;
END $$;

