import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  onUploadProgress?: (progress: number) => void;
  onUploadComplete?: (filePath: string) => void;
  onUploadError?: (error: string) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  uploadUrl?: string;
  currentFile?: File | null;
  uploadProgress?: number;
  uploadStatus?: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
  className?: string;
  disabled?: boolean;
}

export default function FileUpload({
  onFileSelect,
  onFileRemove,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  acceptedFileTypes = ['.pdf', '.docx'],
  maxFileSize = 5 * 1024 * 1024, // 5MB
  currentFile,
  uploadProgress = 0,
  uploadStatus = 'idle',
  error,
  className,
  disabled = false,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
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
  };

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      onUploadError?.(validationError);
      return;
    }

    onFileSelect(file);
  }, [onFileSelect, onUploadError, maxFileSize, acceptedFileTypes]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled, handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
    // Clear the input value so the same file can be selected again
    e.target.value = '';
  }, [handleFileSelect]);

  const handleBrowseClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {!currentFile && (
        <div
          className={cn(
            "file-upload-area rounded-lg p-6 text-center cursor-pointer transition-all duration-200",
            {
              "drag-over": isDragOver,
              "opacity-50 cursor-not-allowed": disabled,
            }
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
          data-testid="file-upload-area"
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="text-lg font-medium text-gray-900 mb-2">
            {isDragOver ? "Drop your file here" : "Upload your resume"}
          </div>
          <div className="text-sm text-gray-500 mb-4">
            Drag and drop your file here, or click to browse
          </div>
          <Button 
            type="button" 
            variant="outline" 
            disabled={disabled}
            data-testid="browse-files-button"
          >
            Browse Files
          </Button>
          <div className="text-xs text-gray-400 mt-2">
            Supported formats: {acceptedFileTypes.join(', ')} • Max size: {Math.round(maxFileSize / (1024 * 1024))}MB
          </div>
        </div>
      )}

      {currentFile && (
        <div className="border rounded-lg p-4 bg-gray-50" data-testid="file-preview">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate" data-testid="file-name">
                  {currentFile.name}
                </p>
                <p className="text-xs text-gray-500" data-testid="file-size">
                  {formatFileSize(currentFile.size)}
                </p>
              </div>
            </div>
            
            {uploadStatus !== 'uploading' && onFileRemove && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onFileRemove}
                disabled={disabled}
                data-testid="remove-file-button"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {uploadStatus === 'uploading' && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" data-testid="upload-progress" />
              <p className="text-xs text-gray-500 text-center">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}

          {uploadStatus === 'success' && (
            <Alert className="border-green-200 bg-green-50" data-testid="upload-success">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                File uploaded successfully
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {error && (
        <Alert variant="destructive" data-testid="upload-error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={acceptedFileTypes.join(',')}
        onChange={handleFileInputChange}
        disabled={disabled}
        data-testid="file-input"
      />
    </div>
  );
}
