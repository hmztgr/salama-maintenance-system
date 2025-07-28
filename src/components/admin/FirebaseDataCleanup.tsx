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
import { useAuth } from '@/contexts/AuthContext';
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

interface CleanupStats {
  companies: number;
  contracts: number;
  branches: number;
  visits: number;
  emergencyTickets: number;
  bugReports: number;
  users: number;
  totalDeleted: number;
}

export default function FirebaseDataCleanup() {
  const { user, hasPermission } = useAuth();
  const [isCleaning, setIsCleaning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<CleanupStats>({
    companies: 0,
    contracts: 0,
    branches: 0,
    visits: 0,
    emergencyTickets: 0,
    bugReports: 0,
    users: 0,
    totalDeleted: 0
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  const cleanupCollection = async (collectionName: string, condition?: any) => {
    try {
      addLog(`Starting cleanup of ${collectionName}...`);
      
      let q = collection(db, collectionName);
      if (condition) {
        q = query(q, where(condition.field, condition.operator, condition.value));
      }
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      let deletedCount = 0;
      
      snapshot.docs.forEach((docSnapshot) => {
        // Skip admin users
        if (collectionName === 'users') {
          const userData = docSnapshot.data();
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
      throw error;
    }
  };

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
      
      // Clean up emergency tickets
      addLog('Cleaning up emergency tickets...');
      await cleanupCollection('emergencyTickets');
      setProgress(30);
      
      // Clean up bug reports
      addLog('Cleaning up bug reports...');
      await cleanupCollection('bugReports');
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
              <div className="text-2xl font-bold">{stats.emergencyTickets}</div>
              <div className="text-sm text-muted-foreground">Emergency Tickets</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{stats.bugReports}</div>
              <div className="text-sm text-muted-foreground">Bug Reports</div>
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
  );
} 