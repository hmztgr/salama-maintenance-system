'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Users,
  Building,
  FileText,
  MapPin,
  Calendar,
  MessageSquare,
  Mail
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContextFirebase';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { deleteUser } from 'firebase/auth';

interface CleanupStats {
  companies: number;
  contracts: number;
  branches: number;
  visits: number;
  visitLogs: number;
  issues: number;
  invitations: number;
  users: number;
  authUsers: number;
  totalDeleted: number;
}

export default function FirebaseDataCleanup() {
  const { authState, hasPermission } = useAuth();
  const [isCleaning, setIsCleaning] = useState(false);
  const [stats, setStats] = useState<CleanupStats>({
    companies: 0,
    contracts: 0,
    branches: 0,
    visits: 0,
    visitLogs: 0,
    issues: 0,
    invitations: 0,
    users: 0,
    authUsers: 0,
    totalDeleted: 0
  });
  const [currentOperation, setCurrentOperation] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Check if user has admin permissions
  if (!hasPermission('admin')) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            غير مصرح
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            تحتاج إلى صلاحيات مدير النظام لاستخدام هذه الأداة.
          </p>
        </CardContent>
      </Card>
    );
  }

  const cleanupCollection = async (collectionName: string): Promise<number> => {
    try {
      setCurrentOperation(`جاري حذف ${collectionName}...`);
      
      const collectionRef = collection(db, collectionName);
      const querySnapshot = await getDocs(collectionRef);
      
      let deletedCount = 0;
      const batch = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        // Skip admin users when cleaning users collection
        if (collectionName === 'users') {
          const userData = docSnapshot.data() as any;
          if (userData.role === 'admin' || userData.email === 'admin@salamasaudi.com') {
            console.log(`Skipping admin user: ${userData.email}`);
            continue;
          }
        }
        
        batch.push(deleteDoc(doc(db, collectionName, docSnapshot.id)));
        deletedCount++;
      }
      
      // Execute all deletions
      await Promise.all(batch);
      
      console.log(`Deleted ${deletedCount} documents from ${collectionName}`);
      return deletedCount;
    } catch (error) {
      console.error(`Error cleaning ${collectionName}:`, error);
      throw error;
    }
  };

  const cleanupAuthUsers = async (): Promise<number> => {
    try {
      setCurrentOperation('جاري حذف مستخدمي Firebase Auth...');
      
      // Get all users from Firestore to find their auth UIDs
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      const uidsToDelete: string[] = [];
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data() as any;
        
        // Skip admin users
        if (userData.role === 'admin' || userData.email === 'admin@salamasaudi.com') {
          console.log(`Skipping admin user: ${userData.email}`);
          continue;
        }
        
        if (userData.uid) {
          uidsToDelete.push(userData.uid);
          console.log(`Will delete auth user: ${userData.email} (UID: ${userData.uid})`);
        }
      }
      
      if (uidsToDelete.length === 0) {
        console.log('No auth users to delete');
        return 0;
      }
      
      // Call the API to delete auth users
      const response = await fetch('/api/admin/delete-auth-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uids: uidsToDelete }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete auth users: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Auth users deletion result:', result);
      
      return result.deletedCount || 0;
    } catch (error) {
      console.error('Error cleaning auth users:', error);
      throw error;
    }
  };

  const cleanupCollections = async () => {
    setIsCleaning(true);
    setError('');
    setSuccess('');
    setStats({
      companies: 0,
      contracts: 0,
      branches: 0,
      visits: 0,
      visitLogs: 0,
      issues: 0,
      invitations: 0,
      users: 0,
      authUsers: 0,
      totalDeleted: 0
    });

    try {
      console.log('🧹 Starting Firebase data cleanup...');

      // Clean up collections
      const companiesDeleted = await cleanupCollection('companies');
      const contractsDeleted = await cleanupCollection('contracts');
      const branchesDeleted = await cleanupCollection('branches');
      const visitsDeleted = await cleanupCollection('visits');
      const visitLogsDeleted = await cleanupCollection('visitLogs');
      const issuesDeleted = await cleanupCollection('issues');
      const invitationsDeleted = await cleanupCollection('invitations');
      const usersDeleted = await cleanupCollection('users');
      const authUsersDeleted = await cleanupAuthUsers();

      const totalDeleted = companiesDeleted + contractsDeleted + branchesDeleted + 
                         visitsDeleted + visitLogsDeleted + issuesDeleted + 
                         invitationsDeleted + usersDeleted + authUsersDeleted;

      setStats({
        companies: companiesDeleted,
        contracts: contractsDeleted,
        branches: branchesDeleted,
        visits: visitsDeleted,
        visitLogs: visitLogsDeleted,
        issues: issuesDeleted,
        invitations: invitationsDeleted,
        users: usersDeleted,
        authUsers: authUsersDeleted,
        totalDeleted
      });

      setSuccess(`تم حذف ${totalDeleted} عنصر بنجاح!`);
      console.log('✅ Cleanup completed successfully');

    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      setError(`حدث خطأ أثناء التنظيف: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setIsCleaning(false);
      setCurrentOperation('');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-red-500" />
          تنظيف بيانات Firebase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>تحذير:</strong> هذا الإجراء سيحذف جميع البيانات التجريبية من Firebase.
            سيتم الحفاظ على حساب المدير فقط. هذا الإجراء لا يمكن التراجع عنه.
          </AlertDescription>
        </Alert>

        <div className="flex gap-4">
          <Button
            onClick={cleanupCollections}
            disabled={isCleaning}
            variant="destructive"
            className="flex items-center gap-2"
          >
            {isCleaning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                جاري التنظيف...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                بدء التنظيف
              </>
            )}
          </Button>
        </div>

        {isCleaning && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">{currentOperation}</p>
            <Progress value={50} className="w-full" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {stats.totalDeleted > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">إحصائيات التنظيف:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <Building className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">الشركات</p>
                  <p className="font-semibold">{stats.companies}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <FileText className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">العقود</p>
                  <p className="font-semibold">{stats.contracts}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                <MapPin className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">الفروع</p>
                  <p className="font-semibold">{stats.branches}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                <Calendar className="w-4 h-4 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">الزيارات</p>
                  <p className="font-semibold">{stats.visits}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                <MessageSquare className="w-4 h-4 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">سجلات الزيارات</p>
                  <p className="font-semibold">{stats.visitLogs}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">المشاكل</p>
                  <p className="font-semibold">{stats.issues}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg">
                <Mail className="w-4 h-4 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-600">الدعوات</p>
                  <p className="font-semibold">{stats.invitations}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Users className="w-4 h-4 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">المستخدمين</p>
                  <p className="font-semibold">{stats.users}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-pink-50 rounded-lg">
                <Users className="w-4 h-4 text-pink-600" />
                <div>
                  <p className="text-sm text-gray-600">مستخدمي Auth</p>
                  <p className="font-semibold">{stats.authUsers}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="text-lg font-semibold text-green-800">
                إجمالي العناصر المحذوفة: {stats.totalDeleted}
              </p>
            </div>
          </div>
        )}

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>ملاحظة:</strong> حذف مستخدمي Firebase Auth يتطلب صلاحيات خاصة على الخادم.
            قد تحتاج إلى حذفهم يدوياً من لوحة تحكم Firebase إذا لم يتم حذفهم تلقائياً.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
} 