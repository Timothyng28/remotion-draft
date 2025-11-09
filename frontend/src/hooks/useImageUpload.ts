/**
 * useImageUpload.ts
 *
 * Reusable hook for handling image upload functionality
 * - File validation (type and size)
 * - Base64 conversion
 * - Drag and drop support
 * - Preview management
 */

import { useCallback, useState } from "react";

interface UseImageUploadOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
}

interface UseImageUploadReturn {
  imageData: string | null;
  imagePreview: string | null;
  fileName: string | null;
  isDragging: boolean;
  error: string | null;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileSelect: (file: File) => void;
  handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: () => void;
  clearError: () => void;
}

export function useImageUpload(
  options: UseImageUploadOptions = {}
): UseImageUploadReturn {
  const {
    maxSizeMB = 5,
    allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
  } = options;

  const [imageData, setImageData] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndProcessFile = useCallback(
    (file: File) => {
      setError(null);

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        setError(
          `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`
        );
        return;
      }

      // Validate file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        setError(`File size exceeds ${maxSizeMB}MB limit`);
        return;
      }

      // Convert to base64
      const reader = new FileReader();

      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        setImageData(base64String);
        setImagePreview(base64String);
        setFileName(file.name);
      };

      reader.onerror = () => {
        setError("Failed to read file");
      };

      reader.readAsDataURL(file);
    },
    [allowedTypes, maxSizeMB]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        validateAndProcessFile(file);
      }
    },
    [validateAndProcessFile]
  );

  const handleFileSelect = useCallback(
    (file: File) => {
      validateAndProcessFile(file);
    },
    [validateAndProcessFile]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        validateAndProcessFile(files[0]);
      }
    },
    [validateAndProcessFile]
  );

  const removeImage = useCallback(() => {
    setImageData(null);
    setImagePreview(null);
    setFileName(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    imageData,
    imagePreview,
    fileName,
    isDragging,
    error,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    handleFileInputChange,
    removeImage,
    clearError,
  };
}
