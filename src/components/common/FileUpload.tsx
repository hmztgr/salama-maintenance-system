'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, FileIcon, ImageIcon, FileTextIcon, Trash2, Eye } from 'lucide-react';
import { useFirebaseStorage, UploadedFile, UploadOptions, FileUploadProgress } from '@/hooks/useFirebaseStorage';
import { FileViewer } from '@/components/ui/file-viewer';

export interface FileUploadProps {
  onFilesUploaded?: (files: UploadedFile[]) => void;
  onFileDeleted?: (filePath: string) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  allowedTypes?: string[];
  folder?: string;
  existingFiles?: UploadedFile[];
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  onFilesUploaded,
  onFileDeleted,
  maxFiles = 5,
  maxSize = 10,
  allowedTypes = ['image', 'pdf', 'doc'],
  folder,
  existingFiles = [],
  accept,
  multiple = true,
  disabled = false,
  className = ''
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(existingFiles);

  // Update uploadedFiles when existingFiles prop changes
  useEffect(() => {
    setUploadedFiles(existingFiles);
  }, [existingFiles]);
  const [uploadProgress, setUploadProgress] = useState<{ [fileName: string]: number }>({});
  const [viewingFile, setViewingFile] = useState<UploadedFile | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    uploading,
    error,
    uploadFiles,
    deleteFile,
    validateFile,
    clearError
  } = useFirebaseStorage();

  // File type icon mapping
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    if (fileType.includes('pdf')) return <FileTextIcon className="w-4 h-4" />;
    return <FileIcon className="w-4 h-4" />;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle file selection
  const handleFileSelection = useCallback((files: FileList | null) => {
    if (!files || disabled) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate each file
    fileArray.forEach(file => {
      const validationError = validateFile(file, {
        maxSize: maxSize * 1024 * 1024,
        allowedTypes
      });

      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
      } else if (uploadedFiles.length + validFiles.length >= maxFiles) {
        errors.push(`تم تجاوز الحد الأقصى للملفات (${maxFiles})`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      console.warn('⚠️ File validation errors:', errors);
      // You might want to show these errors to the user
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  }, [validateFile, maxSize, allowedTypes, maxFiles, uploadedFiles.length, disabled]);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files);
    }
  }, [handleFileSelection]);

  // Upload files
  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    clearError();
    setUploadProgress({});

    const uploadOptions: UploadOptions = {
      folder,
      onProgress: (progress: FileUploadProgress) => {
        // Update progress for current file
        setUploadProgress(prev => ({
          ...prev,
          [`current`]: progress.progress
        }));
      }
    };

    try {
      const uploaded = await uploadFiles(selectedFiles, uploadOptions);
      
      // Update state
      const newUploadedFiles = [...uploadedFiles, ...uploaded];
      setUploadedFiles(newUploadedFiles);
      setSelectedFiles([]);
      setUploadProgress({});
      
      // Notify parent component with ALL files (existing + new)
      onFilesUploaded?.(newUploadedFiles);
      
      console.log('✅ All files uploaded successfully');
    } catch (err) {
      console.error('❌ Upload failed:', err);
    }
  }, [selectedFiles, folder, uploadFiles, onFilesUploaded, clearError]);

  // Remove selected file before upload
  const removeSelectedFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Delete uploaded file
  const handleDeleteFile = useCallback(async (file: UploadedFile) => {
    const success = await deleteFile(file.path);
    if (success) {
      setUploadedFiles(prev => prev.filter(f => f.path !== file.path));
      onFileDeleted?.(file.path);
    }
  }, [deleteFile, onFileDeleted]);

  // Open file input
  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : disabled 
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <CardContent className="p-6 text-center">
          <Upload className={`mx-auto h-12 w-12 mb-4 ${disabled ? 'text-gray-300' : 'text-gray-400'}`} />
          <p className={`text-lg font-medium mb-2 ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
            {disabled ? 'رفع الملفات معطل' : 'اسحب الملفات هنا أو انقر للاختيار'}
          </p>
          <p className="text-sm text-gray-500">
            الحد الأقصى: {maxFiles} ملفات، {maxSize}MB لكل ملف
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {multiple ? 'يمكن اختيار عدة ملفات مرة واحدة' : 'ملف واحد فقط'}
          </p>
          <p className="text-xs text-gray-400">
            الأنواع المدعومة: {allowedTypes.join(', ')}
          </p>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={(e) => handleFileSelection(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            {error.includes('CORS') && (
              <div className="mt-2 text-sm">
                <p>🔧 <strong>CORS Configuration Required:</strong></p>
                <p>Firebase Storage needs CORS configuration for your domain.</p>
                <p>Please follow the instructions in FIREBASE_CORS_SETUP.md</p>
                <p>For now, you can test file uploads locally (localhost:3000)</p>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Selected Files (Before Upload) */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">ملفات محددة ({selectedFiles.length})</h4>
            <Button 
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              size="sm"
            >
              {uploading ? 'جاري الرفع...' : 'رفع الملفات'}
            </Button>
          </div>
          
          {/* Upload Progress */}
          {uploading && uploadProgress.current !== undefined && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>جاري الرفع...</span>
                <span>{Math.round(uploadProgress.current)}%</span>
              </div>
              <Progress value={uploadProgress.current} className="h-2" />
            </div>
          )}

          <div className="grid gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getFileIcon(file.type)}
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSelectedFile(index)}
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">ملفات مرفوعة ({uploadedFiles.length})</h4>
          <div className="grid gap-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  {getFileIcon(file.type)}
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {new Date(file.uploadedAt).toLocaleDateString('en-GB')}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingFile(file)}
                  >
                    <Eye className="w-4 h-4" />
                    عرض
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFile(file)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Viewer Modal */}
      {viewingFile && (
        <FileViewer
          file={viewingFile}
          isOpen={!!viewingFile}
          onClose={() => setViewingFile(null)}
        />
      )}
    </div>
  );
} 