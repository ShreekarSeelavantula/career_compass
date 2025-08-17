import { useState, useCallback } from 'react';

interface FileUploadOptions {
  uploadUrl?: string;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  onUploadProgress?: (progress: number) => void;
  onUploadComplete?: (filePath: string) => void;
  onUploadError?: (error: string) => void;
}

interface FileUploadReturn {
  file: File | null;
  uploadProgress: number;
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error';
  error: string | null;
  selectFile: (file: File) => void;
  removeFile: () => void;
  uploadFile: () => Promise<void>;
  reset: () => void;
}

export function useFileUpload(options: FileUploadOptions = {}): FileUploadReturn {
  const {
    uploadUrl,
    acceptedFileTypes = ['.pdf', '.docx'],
    maxFileSize = 5 * 1024 * 1024,
    onUploadProgress,
    onUploadComplete,
    onUploadError
  } = options;

  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File size must be less than ${Math.round(maxFileSize / (1024 * 1024))}MB`;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFileTypes.includes(fileExtension)) {
      return `File type must be one of: ${acceptedFileTypes.join(', ')}`;
    }

    return null;
  }, [acceptedFileTypes, maxFileSize]);

  const selectFile = useCallback((selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setUploadStatus('error');
      onUploadError?.(validationError);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setUploadStatus('idle');
    setUploadProgress(0);
  }, [validateFile, onUploadError]);

  const removeFile = useCallback(() => {
    setFile(null);
    setError(null);
    setUploadStatus('idle');
    setUploadProgress(0);
  }, []);

  const uploadFile = useCallback(async () => {
    if (!file || !uploadUrl) {
      setError('No file selected or upload URL provided');
      setUploadStatus('error');
      return;
    }

    setUploadStatus('uploading');
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const token = localStorage.getItem('auth_token');
      
      const xhr = new XMLHttpRequest();

      // Set up progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
          onUploadProgress?.(progress);
        }
      });

      // Set up response handling
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            setUploadStatus('success');
            setUploadProgress(100);
            onUploadComplete?.(response.file_path || response.resume_file_path || '');
          } catch (parseError) {
            setError('Failed to parse server response');
            setUploadStatus('error');
            onUploadError?.('Failed to parse server response');
          }
        } else {
          let errorMessage = 'Upload failed';
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            errorMessage = errorResponse.error || errorResponse.message || errorMessage;
          } catch (parseError) {
            errorMessage = xhr.statusText || errorMessage;
          }
          
          setError(errorMessage);
          setUploadStatus('error');
          onUploadError?.(errorMessage);
        }
      });

      xhr.addEventListener('error', () => {
        const errorMessage = 'Network error during upload';
        setError(errorMessage);
        setUploadStatus('error');
        onUploadError?.(errorMessage);
      });

      xhr.addEventListener('abort', () => {
        const errorMessage = 'Upload was cancelled';
        setError(errorMessage);
        setUploadStatus('error');
        onUploadError?.(errorMessage);
      });

      // Set up request
      xhr.open('POST', uploadUrl);
      
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      // Send the request
      xhr.send(formData);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(errorMessage);
      setUploadStatus('error');
      onUploadError?.(errorMessage);
    }
  }, [file, uploadUrl, onUploadProgress, onUploadComplete, onUploadError]);

  const reset = useCallback(() => {
    setFile(null);
    setError(null);
    setUploadStatus('idle');
    setUploadProgress(0);
  }, []);

  return {
    file,
    uploadProgress,
    uploadStatus,
    error,
    selectFile,
    removeFile,
    uploadFile,
    reset
  };
}
