import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContextFirebase';
import { Issue, IssueFormData } from '@/types/issues';

export function useIssues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { authState } = useAuth();

  // Debug authentication state
  useEffect(() => {
    console.log('🔐 useIssues - Auth state changed:', {
      user: authState.user,
      isAuthenticated: authState.isAuthenticated,
      isLoading: authState.isLoading,
      error: authState.error,
      userUid: authState.user?.uid,
      userRole: authState.user?.role,
      userDisplayName: authState.user?.displayName
    });
  }, [authState]);

  // Create new issue
  const createIssue = useCallback(async (issueData: IssueFormData): Promise<string> => {
    try {
      console.log('🔐 Auth state check:', { 
        user: authState.user, 
        isAuthenticated: authState.isAuthenticated,
        isLoading: authState.isLoading,
        userRole: authState.user?.role,
        userUid: authState.user?.uid
      });
      
      // Wait for authentication to be fully loaded
      let attempts = 0;
      while (authState.isLoading && attempts < 5) {
        console.log(`⏳ Waiting for auth to load... attempt ${attempts + 1}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      if (authState.isLoading) {
        throw new Error('جاري التحقق من المصادقة...');
      }
      
      // Check if user is authenticated
      if (!authState.isAuthenticated) {
        console.error('❌ User not authenticated:', authState);
        throw new Error('يجب تسجيل الدخول أولاً');
      }
      
      // Check if user object exists and has uid
      if (!authState.user) {
        console.error('❌ User object is null:', authState);
        throw new Error('بيانات المستخدم غير متوفرة');
      }
      
      // Log the full user object to debug
      console.log('🔍 Full user object:', JSON.stringify(authState.user, null, 2));
      
      // Check if user has uid property
      if (!authState.user.uid) {
        console.error('❌ User UID is missing:', authState.user);
        
        // Try to get UID from different possible locations
        const possibleUid = (authState.user as any).id || (authState.user as any).userId || (authState.user as any).firebaseUid;
        if (possibleUid) {
          console.log('✅ Found UID in alternative location:', possibleUid);
          // Use the alternative UID
          const issueDoc = {
            title: issueData.title,
            description: issueData.description,
            category: issueData.category,
            priority: issueData.priority,
            status: 'open' as const,
            reportedBy: possibleUid,
            reportedByName: authState.user.displayName || authState.user.email || 'مستخدم',
            assignedTo: null,
            assignedByName: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            resolvedAt: null,
            closedAt: null,
            tags: issueData.tags,
            attachments: issueData.attachments,
            customFields: issueData.customFields,
            environment: {
              browser: navigator.userAgent,
              os: navigator.platform,
              device: window.innerWidth < 768 ? 'mobile' : 'desktop',
              url: window.location.href
            }
          };

          const docRef = await addDoc(collection(db, 'issues'), issueDoc);
          await sendIssueNotification(docRef.id, issueData);
          return docRef.id;
        }
        
        // If no UID found, use email as identifier
        if (authState.user.email) {
          console.log('✅ Using email as user identifier:', authState.user.email);
          const issueDoc = {
            title: issueData.title,
            description: issueData.description,
            category: issueData.category,
            priority: issueData.priority,
            status: 'open' as const,
            reportedBy: authState.user.email,
            reportedByName: authState.user.displayName || authState.user.email || 'مستخدم',
            assignedTo: null,
            assignedByName: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            resolvedAt: null,
            closedAt: null,
            tags: issueData.tags,
            attachments: issueData.attachments,
            customFields: issueData.customFields,
            environment: {
              browser: navigator.userAgent,
              os: navigator.platform,
              device: window.innerWidth < 768 ? 'mobile' : 'desktop',
              url: window.location.href
            }
          };

          const docRef = await addDoc(collection(db, 'issues'), issueDoc);
          await sendIssueNotification(docRef.id, issueData);
          return docRef.id;
        }
        
        throw new Error('معرف المستخدم غير متوفر');
      }

      const issueDoc = {
        title: issueData.title,
        description: issueData.description,
        category: issueData.category,
        priority: issueData.priority,
        status: 'open' as const,
        reportedBy: authState.user.uid,
        reportedByName: authState.user.displayName || authState.user.email || 'مستخدم',
        assignedTo: null,
        assignedByName: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        resolvedAt: null,
        closedAt: null,
        tags: issueData.tags,
        attachments: issueData.attachments,
        customFields: issueData.customFields,
        environment: {
          browser: navigator.userAgent,
          os: navigator.platform,
          device: window.innerWidth < 768 ? 'mobile' : 'desktop',
          url: window.location.href
        }
      };

      const docRef = await addDoc(collection(db, 'issues'), issueDoc);
      
      // Send email notification to admins
      await sendIssueNotification(docRef.id, issueData);
      
      return docRef.id;
    } catch (err) {
      console.error('Failed to create issue:', err);
      throw new Error('فشل في إنشاء المشكلة');
    }
  }, [authState.user]);

  // Update issue
  const updateIssue = useCallback(async (issueId: string, updates: Partial<Issue>): Promise<void> => {
    try {
      if (!authState.user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const issueRef = doc(db, 'issues', issueId);
      await updateDoc(issueRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Failed to update issue:', err);
      throw new Error('فشل في تحديث المشكلة');
    }
  }, [authState.user]);

  // Delete issue (admin only)
  const deleteIssue = useCallback(async (issueId: string): Promise<void> => {
    try {
      if (!authState.user || authState.user.role !== 'admin') {
        throw new Error('ليس لديك صلاحية لحذف المشاكل');
      }

      const issueRef = doc(db, 'issues', issueId);
      await deleteDoc(issueRef);
    } catch (err) {
      console.error('Failed to delete issue:', err);
      throw new Error('فشل في حذف المشكلة');
    }
  }, [authState.user]);

  // Load issues with real-time updates
  useEffect(() => {
    if (!authState.user) {
      setIssues([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Build query based on user role
    let issuesQuery = query(
      collection(db, 'issues'),
      orderBy('createdAt', 'desc')
    );

    // Non-admin users see only their issues or assigned issues
    if (authState.user.role !== 'admin') {
      issuesQuery = query(
        collection(db, 'issues'),
        where('reportedBy', '==', authState.user.uid),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(
      issuesQuery,
      (snapshot) => {
        const issuesData: Issue[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          issuesData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
            resolvedAt: data.resolvedAt?.toDate?.()?.toISOString() || data.resolvedAt,
            closedAt: data.closedAt?.toDate?.()?.toISOString() || data.closedAt,
          } as Issue);
        });
        setIssues(issuesData);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to load issues:', err);
        setError('فشل في تحميل المشاكل');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [authState.user]);

  return {
    issues,
    loading,
    error,
    createIssue,
    updateIssue,
    deleteIssue
  };
}

// Email notification function
async function sendIssueNotification(issueId: string, issueData: IssueFormData) {
  try {
    // Get admin users
    const adminQuery = query(
      collection(db, 'users'),
      where('role', '==', 'admin')
    );
    
    const adminSnapshot = await getDocs(adminQuery);
    const adminEmails = adminSnapshot.docs.map(doc => doc.data().email);

    // Send email to admins (placeholder for now)
    console.log('Sending notifications to admins:', adminEmails);
    
    // TODO: Implement actual email sending
    // for (const email of adminEmails) {
    //   await emailService.sendIssueNotification({
    //     to_email: email,
    //     issue_title: issueData.title,
    //     issue_category: issueData.category,
    //     issue_priority: issueData.priority,
    //     reporter_name: authState.user?.displayName || 'مستخدم',
    //     issue_url: `${window.location.origin}/issues/${issueId}`
    //   });
    // }
  } catch (error) {
    console.error('Failed to send issue notification:', error);
  }
} 