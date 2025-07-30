'use client';

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
  XCircle,
  MessageSquare,
  Mail
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
  const [progress, setProgress] = useState(0);
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
  const [logs, setLogs] = useState<string[]>([]);
  const [currentOperation, setCurrentOperation] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add state for branch ID fix
  const [isFixingBranchIds, setIsFixingBranchIds] = useState(false);
  const [branchIdFixStats, setBranchIdFixStats] = useState({
    totalBranches: 0,
    fixedBranches: 0,
    errors: 0
  });

  // Check if user has admin permissions
  if (!hasPermission('admin')) {
    return (
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
          </p>
        </CardContent>
      </Card>
    );
  }

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

  const cleanupCollection = async (collectionName: string, condition?: any): Promise<number> => {
    try {
      setCurrentOperation(`Cleaning up ${collectionName}...`);
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
          if (userData.role === 'admin' || userData.email === 'admin@salamasaudi.com') {
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
      throw error;
    }
  };

  const cleanupAuthUsers = async (): Promise<number> => {
    try {
      setCurrentOperation('Cleaning up Firebase Auth users...');
      addLog('Starting cleanup of Firebase Auth users...');
      
      // Get all users from Firestore to find their auth UIDs
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      const uidsToDelete: string[] = [];
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data() as any;
        
        // Skip admin users
        if (userData.role === 'admin' || userData.email === 'admin@salamasaudi.com') {
          addLog(`Skipping admin user: ${userData.email}`);
          continue;
        }
        
        if (userData.uid) {
          uidsToDelete.push(userData.uid);
          addLog(`Will delete auth user: ${userData.email} (UID: ${userData.uid})`);
        }
      }
      
      if (uidsToDelete.length === 0) {
        addLog('No auth users to delete');
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
      addLog(`Auth users deletion result: ${JSON.stringify(result)}`);
      
      return result.deletedCount || 0;
    } catch (error) {
      addLog(`Error cleaning auth users: ${error}`);
      throw error;
    }
  };

  const performCleanup = async () => {
    setIsCleaning(true);
    setProgress(0);
    setLogs([]);
    setError(null);
    setSuccess(null);
    
    try {
      addLog('Starting Firebase data cleanup...');
      setProgress(10);
      
      // Clean up visits first (they reference other collections)
      addLog('Cleaning up visits...');
      await cleanupCollection('visits');
      setProgress(20);
      
      // Clean up visit logs
      addLog('Cleaning up visit logs...');
      await cleanupCollection('visitLogs');
      setProgress(25);
      
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
      
      // Clean up auth users
      addLog('Cleaning up Firebase Auth users...');
      await cleanupAuthUsers();
      setProgress(90);
      
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
      setProgress(100);
      
      addLog('Cleanup completed successfully!');
      setSuccess('Cleanup completed successfully! All test data has been removed while preserving admin users.');
      
    } catch (error) {
      addLog(`Cleanup failed: ${error}`);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsCleaning(false);
      setCurrentOperation('');
    }
  };

  // Fix duplicate branch IDs
  const fixDuplicateBranchIds = async () => {
    if (!confirm('Are you sure you want to fix duplicate branch IDs? This will regenerate unique IDs for all branches.')) {
      return;
    }

    try {
      setIsFixingBranchIds(true);
      setError(null);
      setSuccess('Fixing duplicate branch IDs...');

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

      setSuccess(`Fixed ${fixedCount} branches successfully. Errors: ${errorCount}`);
    } catch (error) {
      console.error('Error fixing branch IDs:', error);
      setError(`Error fixing branch IDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
              <MessageSquare className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <div className="text-2xl font-bold">{stats.visitLogs}</div>
              <div className="text-sm text-muted-foreground">Visit Logs</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <div className="text-2xl font-bold">{stats.issues}</div>
              <div className="text-sm text-muted-foreground">Issues</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <Mail className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{stats.invitations}</div>
              <div className="text-sm text-muted-foreground">Invitations</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <Users className="h-6 w-6 mx-auto mb-2 text-indigo-500" />
              <div className="text-2xl font-bold">{stats.users}</div>
              <div className="text-sm text-muted-foreground">Users (Non-Admin)</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <Users className="h-6 w-6 mx-auto mb-2 text-pink-500" />
              <div className="text-2xl font-bold">{stats.authUsers}</div>
              <div className="text-sm text-muted-foreground">Auth Users</div>
            </div>
            <div className="text-center p-3 border rounded-lg bg-green-50">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">{stats.totalDeleted}</div>
              <div className="text-sm text-muted-foreground">Total Deleted</div>
            </div>
          </div>
          
          <div className="flex gap-4 flex-wrap">
            <Button 
              onClick={performCleanup} 
              disabled={isCleaning}
              variant="destructive"
              className="flex items-center gap-2"
            >
              {isCleaning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Cleaning Up...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Start Cleanup
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
                  Fixing...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" />
                  Fix Branch IDs
                </>
              )}
            </Button>
          </div>
          
          {isCleaning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{currentOperation}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
          
          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {success}
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

      {branchIdFixStats.totalBranches > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Branch ID Fix Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <MapPin className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Branches</p>
                  <p className="font-semibold">{branchIdFixStats.totalBranches}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Fixed</p>
                  <p className="font-semibold">{branchIdFixStats.fixedBranches}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                <XCircle className="w-4 h-4 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Errors</p>
                  <p className="font-semibold">{branchIdFixStats.errors}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 