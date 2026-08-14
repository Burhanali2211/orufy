import React from 'react';
import { Image as ImageIcon, Loader, Upload, Camera } from 'lucide-react';

interface UploadAreaProps {
  isDragging: boolean;
  isUploading: boolean;
  uploadProgress: { percentage: number } | null;
  placeholder: string;
  disabled: boolean;
  multiple: boolean;
  accept: string;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCameraCapture: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  aspectRatioClass: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  uploadId: string;
}

export const UploadArea: React.FC<UploadAreaProps> = ({
  isDragging, isUploading, uploadProgress, placeholder, disabled, multiple, accept,
  onFileSelect, onCameraCapture, onDragOver, onDragLeave, onDrop,
  aspectRatioClass, fileInputRef, cameraInputRef, uploadId
}) => (
  <div
    onDragOver={onDragOver}
    onDragLeave={onDragLeave}
    onDrop={onDrop}
    className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
      isDragging ? 'border-amber-400 bg-amber-50' : 'border-gray-300 hover:border-gray-400'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${aspectRatioClass}`}
  >
    <input ref={fileInputRef} id={`${uploadId}-file`} type="file" accept={accept} onChange={onFileSelect} className="hidden" disabled={disabled} multiple={multiple} />
    <input ref={cameraInputRef} id={`${uploadId}-camera`} type="file" accept="image/*" capture="environment" onChange={onFileSelect} className="hidden" disabled={disabled} />

    <div className="flex flex-col items-center justify-center h-full min-h-[120px]">
      {isUploading ? (
        <div className="space-y-2">
          <Loader className="h-8 w-8 text-amber-500 hidden mx-auto" />
          <p className="text-sm text-gray-600 font-medium">Uploading...</p>
          {uploadProgress && (
            <div className="w-48 mx-auto">
              <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${uploadProgress.percentage}%` }} />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">{uploadProgress.percentage}%</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <ImageIcon className="h-12 w-12 text-gray-400 mb-3" />
          <p className="text-sm text-gray-600 mb-4">{placeholder}</p>
          <div className="flex gap-4 justify-center">
            <button type="button" disabled={disabled} className="group flex flex-col items-center gap-1" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
              <div className="p-2.5 bg-gray-100 rounded-lg group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                <Upload className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-semibold text-gray-500 group-hover:text-amber-600">UPLOAD</span>
            </button>
            <button type="button" disabled={disabled} className="group flex flex-col items-center gap-1" onClick={(e) => { e.stopPropagation(); onCameraCapture(); }}>
              <div className="p-2.5 bg-gray-100 rounded-lg group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                <Camera className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-semibold text-gray-500 group-hover:text-amber-600">CAMERA</span>
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-4 uppercase tracking-wider">PNG, JPG, WEBP • Max 50MB</p>
        </>
      )}
    </div>
  </div>
);
