<<<<<<< HEAD
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  Users, 
  Building2, 
  FileText, 
  MapPin, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextFirebase';
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where,
  writeBatch,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
=======
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
import { collection, getDocs, deleteDoc, doc, query, where, writeBatch } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { deleteUser } from 'firebase/auth';

interface Branch {
  id: string;
  companyId: string;
  city: string;
  location: string;
  branchId: string;
  [key: string]: any;
}
>>>>>>> SSCO-planner-prod

interface CleanupStats {
  companies: number;
  contracts: number;
  branches: number;
  visits: number;
<<<<<<< HEAD
  issues: number;
  invitations: number;
  users: number;
=======
  visitLogs: number;
  issues: number;
  invitations: number;
  users: number;
  authUsers: number;
>>>>>>> SSCO-planner-prod
  totalDeleted: number;
}

export default function FirebaseDataCleanup() {
  const { authState, hasPermission } = useAuth();
  const [isCleaning, setIsCleaning] = useState(false);
<<<<<<< HEAD
  const [progress, setProgress] = useState(0);
=======
>>>>>>> SSCO-planner-prod
  const [stats, setStats] = useState<CleanupStats>({
    companies: 0,
    contracts: 0,
    branches: 0,
    visits: 0,
<<<<<<< HEAD
    issues: 0,
    invitations: 0,
    users: 0,
    totalDeleted: 0
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
=======
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

  // Add state for branch ID fix
  const [isFixingBranchIds, setIsFixingBranchIds] = useState(false);
  const [branchIdFixStats, setBranchIdFixStats] = useState({
    totalBranches: 0,
    fixedBranches: 0,
    errors: 0
  });
>>>>>>> SSCO-planner-prod

  // Check if user has admin permissions
  if (!hasPermission('admin')) {
    return (
<<<<<<< HEAD
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Only administrators can perform Firebase data cleanup operations.
=======
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
>>>>>>> SSCO-planner-prod
          </p>
        </CardContent>
      </Card>
    );
  }

<<<<<<< HEAD
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const updateStats = (type: keyof CleanupStats, count: number) => {
    setStats(prev => ({
      ...prev,
      [type]: count,
      totalDeleted: prev.totalDeleted + count
    }));
  };

  const cleanupCollection = async (collectionName: string, condition?: any) => {
    try {
      addLog(`Starting cleanup of ${collectionName}...`);
      
      let q: any = collection(db, collectionName);
      if (condition) {
        q = query(q, where(condition.field, condition.operator, condition.value));
      }
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      let deletedCount = 0;
      
      snapshot.docs.forEach((docSnapshot) => {
        // Skip admin users
        if (collectionName === 'users') {
          const userData = docSnapshot.data() as any;
          if (userData.role === 'admin') {
            addLog(`Skipping admin user: ${userData.email}`);
            return;
          }
        }
        
        batch.delete(docSnapshot.ref);
        deletedCount++;
      });
      
      if (deletedCount > 0) {
        await batch.commit();
        addLog(`Deleted ${deletedCount} documents from ${collectionName}`);
        updateStats(collectionName as keyof CleanupStats, deletedCount);
      } else {
        addLog(`No documents to delete in ${collectionName}`);
      }
      
      return deletedCount;
    } catch (error) {
      addLog(`Error cleaning up ${collectionName}: ${error}`);
=======
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
>>>>>>> SSCO-planner-prod
      throw error;
    }
  };

<<<<<<< HEAD
  const performCleanup = async () => {
    setIsCleaning(true);
    setProgress(0);
    setLogs([]);
    setError(null);
    setSuccess(false);
    
    try {
      addLog('Starting Firebase data cleanup...');
      setProgress(10);
      
      // Clean up visits first (they reference other collections)
      addLog('Cleaning up visits...');
      await cleanupCollection('visits');
      setProgress(20);
      
      // Clean up issues
      addLog('Cleaning up issues...');
      await cleanupCollection('issues');
      setProgress(30);
      
      // Clean up invitations
      addLog('Cleaning up invitations...');
      await cleanupCollection('invitations');
      setProgress(40);
      
      // Clean up branches
      addLog('Cleaning up branches...');
      await cleanupCollection('branches');
      setProgress(50);
      
      // Clean up contracts
      addLog('Cleaning up contracts...');
      await cleanupCollection('contracts');
      setProgress(60);
      
      // Clean up companies
      addLog('Cleaning up companies...');
      await cleanupCollection('companies');
      setProgress(70);
      
      // Clean up non-admin users
      addLog('Cleaning up non-admin users...');
      await cleanupCollection('users', { field: 'role', operator: '!=', value: 'admin' });
      setProgress(80);
      
      // Clean up any other test data collections
      addLog('Cleaning up other test data...');
      const testCollections = ['testData', 'demoData', 'tempData'];
      for (const collectionName of testCollections) {
        try {
          await cleanupCollection(collectionName);
        } catch (error) {
          // Collection might not exist, ignore
        }
      }
      setProgress(90);
      
      addLog('Cleanup completed successfully!');
      setProgress(100);
      setSuccess(true);
      
    } catch (error) {
      addLog(`Cleanup failed: ${error}`);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            Firebase Data Cleanup
          </CardTitle>
          <CardDescription>
            Clean up all test data from Firebase while preserving admin users. This operation cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This will permanently delete all test data including companies, contracts, 
              branches, visits, emergency tickets, bug reports, and non-admin users. Admin users will be preserved.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <Building2 className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{stats.companies}</div>
              <div className="text-sm text-muted-foreground">Companies</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <FileText className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{stats.contracts}</div>
              <div className="text-sm text-muted-foreground">Contracts</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <MapPin className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">{stats.branches}</div>
              <div className="text-sm text-muted-foreground">Branches</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{stats.visits}</div>
              <div className="text-sm text-muted-foreground">Visits</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <div className="text-2xl font-bold">{stats.issues}</div>
              <div className="text-sm text-muted-foreground">Issues</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{stats.invitations}</div>
              <div className="text-sm text-muted-foreground">Invitations</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <Users className="h-6 w-6 mx-auto mb-2 text-indigo-500" />
              <div className="text-2xl font-bold">{stats.users}</div>
              <div className="text-sm text-muted-foreground">Users (Non-Admin)</div>
            </div>
            <div className="text-center p-3 border rounded-lg bg-green-50">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">{stats.totalDeleted}</div>
              <div className="text-sm text-muted-foreground">Total Deleted</div>
            </div>
          </div>
          
          {isCleaning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Cleanup Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
          
          <Button 
            onClick={performCleanup} 
            disabled={isCleaning}
            variant="destructive"
            className="w-full"
          >
            {isCleaning ? 'Cleaning Up...' : 'Start Cleanup'}
          </Button>
          
          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Cleanup completed successfully! All test data has been removed while preserving admin users.
              </AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert>
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Error during cleanup: {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cleanup Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="text-sm font-mono bg-gray-50 p-2 rounded">
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
=======
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

  // Fix duplicate branch IDs
  const fixDuplicateBranchIds = async () => {
    if (!confirm('هل أنت متأكد من إصلاح معرفات الفروع المكررة؟ سيتم إعادة إنشاء معرفات فريدة لجميع الفروع.')) {
      return;
    }

    try {
      setIsFixingBranchIds(true);
      setError('');
      setSuccess('جاري إصلاح معرفات الفروع المكررة...');

      // Get all branches
      const branchesSnapshot = await getDocs(collection(db, 'branches'));
      const branches = branchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Branch[];

      setBranchIdFixStats(prev => ({ ...prev, totalBranches: branches.length }));

      // Group branches by company
      const branchesByCompany = branches.reduce((acc, branch) => {
        const companyId = branch.companyId;
        if (!acc[companyId]) {
          acc[companyId] = [];
        }
        acc[companyId].push(branch);
        return acc;
      }, {} as Record<string, Branch[]>);

      const batch = writeBatch(db);
      let fixedCount = 0;
      let errorCount = 0;

      // Process each company's branches
      for (const [companyId, companyBranches] of Object.entries(branchesByCompany)) {
        // Group by city and location to ensure proper numbering
        const branchesByLocation = companyBranches.reduce((acc, branch) => {
          const key = `${branch.city}-${branch.location}`;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(branch);
          return acc;
        }, {} as Record<string, Branch[]>);

        let locationCounter = 1;
        
        for (const [locationKey, locationBranches] of Object.entries(branchesByLocation)) {
          const [city, location] = locationKey.split('-');
          
          locationBranches.forEach((branch: Branch, index: number) => {
            try {
              // Generate new unique branch ID
              const newBranchId = `${companyId}-${getCityCode(city)}-${locationCounter.toString().padStart(3, '0')}-${(index + 1).toString().padStart(4, '0')}`;
              
              // Update branch document
              const branchRef = doc(db, 'branches', branch.id);
              batch.update(branchRef, { branchId: newBranchId });
              
              fixedCount++;
            } catch (error) {
              console.error(`Error fixing branch ${branch.id}:`, error);
              errorCount++;
            }
          });
          
          locationCounter++;
        }
      }

      // Commit all updates
      await batch.commit();

      setBranchIdFixStats({
        totalBranches: branches.length,
        fixedBranches: fixedCount,
        errors: errorCount
      });

      setSuccess(`تم إصلاح ${fixedCount} فرع بنجاح. الأخطاء: ${errorCount}`);
    } catch (error) {
      console.error('Error fixing branch IDs:', error);
      setError(`خطأ في إصلاح معرفات الفروع: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setIsFixingBranchIds(false);
    }
  };

  // Helper function to get city code
  const getCityCode = (city: string): string => {
    const cityCodes: Record<string, string> = {
      'الرياض': 'RYD',
      'جدة': 'JED',
      'الدمام': 'DAM',
      'مكة': 'MKA',
      'مكة المكرمة': 'MKA',
      'المدينة': 'MDN',
      'المدينة المنورة': 'MDN',
      'تبوك': 'TBK',
      'أبها': 'ABH',
      'الطائف': 'TAF',
      'الجبيل': 'JUB',
      'ينبع': 'YAN',
      'الخبر': 'KHO',
      'القطيف': 'QAT',
      'الأحساء': 'AHS',
      'خميس مشيط': 'KHM',
      'بريدة': 'BUR',
      'حائل': 'HAI',
      'الظهران': 'DHA',
      'عرعر': 'ARA',
      'سكاكا': 'SAK',
      'جازان': 'JAZ',
      'جيزان': 'JAZ',
      'نجران': 'NAJ',
      'الباحة': 'BAH',
      'القريات': 'QUR'
    };
    
    return cityCodes[city] || 'UNK';
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

        <div className="flex gap-4 flex-wrap">
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

          <Button
            onClick={fixDuplicateBranchIds}
            disabled={isFixingBranchIds}
            variant="outline"
            className="flex items-center gap-2 border-orange-500 text-orange-600 hover:bg-orange-50"
          >
            {isFixingBranchIds ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                جاري الإصلاح...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                إصلاح معرفات الفروع
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

        {branchIdFixStats.totalBranches > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">إحصائيات إصلاح معرفات الفروع:</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <MapPin className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">إجمالي الفروع</p>
                  <p className="font-semibold">{branchIdFixStats.totalBranches}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">تم الإصلاح</p>
                  <p className="font-semibold">{branchIdFixStats.fixedBranches}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                <XCircle className="w-4 h-4 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">الأخطاء</p>
                  <p className="font-semibold">{branchIdFixStats.errors}</p>
                </div>
              </div>
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
>>>>>>> SSCO-planner-prod
  );
} 