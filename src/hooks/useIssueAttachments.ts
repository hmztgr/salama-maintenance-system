import { useState, useCallback } from 'react';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  StorageReference 
} from 'firebase/storage';
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { storage, db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContextFirebase';
import { IssueAttachment } from '@/types/issues';
import { FILE_UPLOAD_CONFIG } from '@/lib/constants/issues';

export function useIssueAttachments() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const { authState } = useAuth();

  // Upload single file
  const uploadFile = useCallback(async (
    file: File, 
    issueId: string, 
    commentId?: string
  ): Promise<IssueAttachment> => {
    try {
      if (!authState.user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      // Validate file
      if (file.size > FILE_UPLOAD_CONFIG.maxSize) {
        throw new Error(`حجم الملف كبير جداً (الحد الأقصى ${FILE_UPLOAD_CONFIG.maxSize / (1024 * 1024)} ميجابايت)`);
      }

      const isAcceptedType = FILE_UPLOAD_CONFIG.acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      });

      if (!isAcceptedType) {
        throw new Error('نوع الملف غير مدعوم');
      }

      // Create storage reference
      const fileName = `${Date.now()}-${file.name}`;
      const storagePath = `issue-attachments/${issueId}/${fileName}`;
      const storageRef = ref(storage, storagePath);

      // Upload file
      setUploading(true);
      setUploadProgress(prev => ({ ...prev, [fileName]: 0 }));

      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadUrl = await getDownloadURL(snapshot.ref);

      // Create thumbnail URL for images
      let thumbnailUrl: string | undefined;
      if (file.type.startsWith('image/')) {
        // For now, use the same URL as thumbnail
        // In production, you might want to create actual thumbnails
        thumbnailUrl = downloadUrl;
      }

      // Save attachment metadata to Firestore
      const attachmentData = {
        issueId,
        commentId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadedBy: authState.user.uid,
        uploadedByName: authState.user.displayName || 'مستخدم',
        uploadedAt: serverTimestamp(),
        storagePath,
        downloadUrl,
        thumbnailUrl,
        isImage: file.type.startsWith('image/')
      };

      const docRef = await addDoc(collection(db, 'issue_attachments'), attachmentData);

      setUploadProgress(prev => ({ ...prev, [fileName]: 100 }));

      return {
        id: docRef.id,
        ...attachmentData,
        uploadedAt: new Date().toISOString()
      } as IssueAttachment;

    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    } finally {
      setUploading(false);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[file.name];
        return newProgress;
      });
    }
  }, [authState.user]);

  // Upload multiple files
  const uploadAttachments = useCallback(async (
    files: File[], 
    issueId: string, 
    commentId?: string
  ): Promise<IssueAttachment[]> => {
    try {
      if (files.length > FILE_UPLOAD_CONFIG.maxFiles) {
        throw new Error(`يمكن إرفاق ${FILE_UPLOAD_CONFIG.maxFiles} ملفات كحد أقصى`);
      }

      const uploadPromises = files.map(file => uploadFile(file, issueId, commentId));
      const results = await Promise.all(uploadPromises);

      return results;
    } catch (error) {
      console.error('Failed to upload attachments:', error);
      throw error;
    }
  }, [uploadFile]);

  // Delete attachment
  const deleteAttachment = useCallback(async (attachmentId: string, storagePath: string): Promise<void> => {
    try {
      if (!authState.user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      // Delete from Firebase Storage
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);

      // Delete from Firestore (this would typically be done with a Cloud Function)
      // For now, we'll just log it
      console.log('Attachment deleted:', attachmentId);
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      throw error;
    }
  }, [authState.user]);

  // Get file preview URL
  const getFilePreviewUrl = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      } else {
        // For non-image files, return a placeholder
        resolve('/placeholder-file.png');
      }
    });
  }, []);

  return {
    uploading,
    uploadProgress,
    uploadFile,
    uploadAttachments,
    deleteAttachment,
    getFilePreviewUrl
  };
} 