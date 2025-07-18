import { useState, useCallback } from 'react';
import { 
  ref, 
  uploadBytes, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject, 
  listAll,
  getMetadata,
  UploadTaskSnapshot 
} from 'firebase/storage';
import { storage } from '@/lib/firebase/config';

export interface FileUploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
  state: 'running' | 'paused' | 'success' | 'error';
}

export interface UploadedFile {
  name: string;
  url: string;
  path: string;
  size: number;
  type: string;
  uploadedAt: string;
  metadata?: any;
}

export interface UploadOptions {
  folder?: string;
  customName?: string;
  metadata?: { [key: string]: string };
  onProgress?: (progress: FileUploadProgress) => void;
}

export function useFirebaseStorage() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate unique filename
  const generateFileName = useCallback((originalName: string, customName?: string): string => {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    const baseName = customName || originalName.replace(/\.[^/.]+$/, "");
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
    return `${sanitizedName}_${timestamp}.${extension}`;
  }, []);

  // Get file path based on type and context
  const getFilePath = useCallback((file: File, options: UploadOptions): string => {
    const { folder, customName } = options;
    const fileName = generateFileName(file.name, customName);
    
    // Organize files by type and context
    let basePath = '';
    
    if (folder) {
      basePath = folder;
    } else {
      // Auto-organize by file type
      if (file.type.startsWith('image/')) {
        basePath = 'images/visits';
      } else if (file.type.includes('pdf')) {
        basePath = 'documents/contracts';
      } else if (file.type.includes('word') || file.type.includes('doc')) {
        basePath = 'documents/reports';
      } else {
        basePath = 'files/misc';
      }
    }
    
    return `${basePath}/${fileName}`;
  }, [generateFileName]);

  // Upload single file
  const uploadFile = useCallback(
    async (file: File, options: UploadOptions = {}): Promise<UploadedFile> => {
      try {
        setUploading(true);
        setError(null);
        setUploadProgress(null);

        console.log('📤 Starting file upload:', file.name, 'Size:', file.size, 'bytes');

        const filePath = getFilePath(file, options);
        const storageRef = ref(storage, filePath);

        // Prepare metadata
        const metadata = {
          contentType: file.type,
          customMetadata: {
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
            ...options.metadata
          }
        };

        // Use resumable upload for better progress tracking
        const uploadTask = uploadBytesResumable(storageRef, file, metadata);

        return new Promise((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot: UploadTaskSnapshot) => {
              // Progress updates
              const progress: FileUploadProgress = {
                bytesTransferred: snapshot.bytesTransferred,
                totalBytes: snapshot.totalBytes,
                progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
                state: snapshot.state as FileUploadProgress['state']
              };
              
              setUploadProgress(progress);
              options.onProgress?.(progress);
              
              console.log('📊 Upload progress:', Math.round(progress.progress) + '%');
            },
            (error) => {
              // Error handling
              console.error('❌ Upload failed:', error);
              setError('فشل في رفع الملف: ' + error.message);
              setUploading(false);
              reject(error);
            },
            async () => {
              // Upload completed successfully
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                const fileMetadata = await getMetadata(uploadTask.snapshot.ref);
                
                const uploadedFile: UploadedFile = {
                  name: file.name,
                  url: downloadURL,
                  path: filePath,
                  size: file.size,
                  type: file.type,
                  uploadedAt: new Date().toISOString(),
                  metadata: fileMetadata.customMetadata
                };

                console.log('✅ File uploaded successfully:', uploadedFile);
                setUploading(false);
                setUploadProgress(null);
                resolve(uploadedFile);
              } catch (err) {
                console.error('❌ Error getting download URL:', err);
                setError('فشل في الحصول على رابط الملف');
                setUploading(false);
                reject(err);
              }
            }
          );
        });

      } catch (err) {
        console.error('❌ Upload error:', err);
        const errorMessage = err instanceof Error ? err.message : 'فشل في رفع الملف';
        setError(errorMessage);
        setUploading(false);
        throw err;
      }
    },
    [getFilePath]
  );

  // Upload multiple files
  const uploadFiles = useCallback(
    async (files: File[], options: UploadOptions = {}): Promise<UploadedFile[]> => {
      const uploadedFiles: UploadedFile[] = [];
      const errors: string[] = [];

      for (let i = 0; i < files.length; i++) {
        try {
          console.log(`📤 Uploading file ${i + 1}/${files.length}:`, files[i].name);
          
          const uploadedFile = await uploadFile(files[i], {
            ...options,
            onProgress: (progress) => {
              // Adjust progress for multiple files
              const overallProgress = {
                ...progress,
                progress: ((i * 100) + progress.progress) / files.length
              };
              options.onProgress?.(overallProgress);
            }
          });
          
          uploadedFiles.push(uploadedFile);
        } catch (err) {
          const errorMsg = `فشل في رفع ${files[i].name}: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`;
          errors.push(errorMsg);
          console.error('❌', errorMsg);
        }
      }

      if (errors.length > 0) {
        setError(`تم رفع ${uploadedFiles.length} من ${files.length} ملفات. أخطاء: ${errors.join(', ')}`);
      }

      return uploadedFiles;
    },
    [uploadFile]
  );

  // Delete file
  const deleteFile = useCallback(
    async (filePath: string): Promise<boolean> => {
      try {
        console.log('🗑️ Deleting file:', filePath);
        
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
        
        console.log('✅ File deleted successfully');
        setError(null);
        return true;
      } catch (err) {
        console.error('❌ Delete failed:', err);
        const errorMessage = err instanceof Error ? err.message : 'فشل في حذف الملف';
        setError(errorMessage);
        return false;
      }
    },
    []
  );

  // Get file URL
  const getFileURL = useCallback(
    async (filePath: string): Promise<string | null> => {
      try {
        const fileRef = ref(storage, filePath);
        const url = await getDownloadURL(fileRef);
        return url;
      } catch (err) {
        console.error('❌ Error getting file URL:', err);
        setError('فشل في الحصول على رابط الملف');
        return null;
      }
    },
    []
  );

  // List files in folder
  const listFiles = useCallback(
    async (folderPath: string): Promise<UploadedFile[]> => {
      try {
        console.log('📂 Listing files in:', folderPath);
        
        const folderRef = ref(storage, folderPath);
        const result = await listAll(folderRef);
        
        const files: UploadedFile[] = [];
        
        for (const itemRef of result.items) {
          try {
            const url = await getDownloadURL(itemRef);
            const metadata = await getMetadata(itemRef);
            
            files.push({
              name: metadata.customMetadata?.originalName || itemRef.name,
              url,
              path: itemRef.fullPath,
              size: metadata.size || 0,
              type: metadata.contentType || '',
              uploadedAt: metadata.customMetadata?.uploadedAt || metadata.timeCreated,
              metadata: metadata.customMetadata
            });
          } catch (itemErr) {
            console.warn('⚠️ Error processing file:', itemRef.name, itemErr);
          }
        }
        
        console.log('📂 Found', files.length, 'files');
        return files;
      } catch (err) {
        console.error('❌ Error listing files:', err);
        setError('فشل في جلب قائمة الملفات');
        return [];
      }
    },
    []
  );

  // Validate file before upload
  const validateFile = useCallback(
    (file: File, options: { maxSize?: number; allowedTypes?: string[] } = {}): string | null => {
      const { maxSize = 10 * 1024 * 1024, allowedTypes } = options; // Default 10MB

      // Check file size
      if (file.size > maxSize) {
        return `حجم الملف كبير جداً. الحد الأقصى ${Math.round(maxSize / 1024 / 1024)}MB`;
      }

      // Check file type
      if (allowedTypes && !allowedTypes.some(type => file.type.includes(type))) {
        return `نوع الملف غير مدعوم. الأنواع المدعومة: ${allowedTypes.join(', ')}`;
      }

      return null;
    },
    []
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    uploading,
    uploadProgress,
    error,
    
    // File operations
    uploadFile,
    uploadFiles,
    deleteFile,
    getFileURL,
    listFiles,
    
    // Utilities
    validateFile,
    clearError,
    
    // Helper functions
    generateFileName,
    getFilePath
  };
} 