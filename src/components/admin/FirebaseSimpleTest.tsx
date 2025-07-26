'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function FirebaseSimpleTest() {
  const [testResults, setTestResults] = useState<{
    companies: any[];
    branches: any[];
    contracts: any[];
    visits: any[];
    loading: boolean;
    error: string | null;
  }>({
    companies: [],
    branches: [],
    contracts: [],
    visits: [],
    loading: false,
    error: null
  });

  const testFirebaseConnection = async () => {
    setTestResults(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('🧪 Starting Firebase connection test...');
      
      // Test companies collection
      console.log('🏢 Testing companies collection...');
      const companiesSnapshot = await getDocs(collection(db, 'companies'));
      const companies = companiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('🏢 Companies found:', companies.length, companies);
      
      // Test branches collection
      console.log('🏪 Testing branches collection...');
      const branchesSnapshot = await getDocs(collection(db, 'branches'));
      const branches = branchesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('🏪 Branches found:', branches.length, branches);
      
      // Test contracts collection
      console.log('📋 Testing contracts collection...');
      const contractsSnapshot = await getDocs(collection(db, 'contracts'));
      const contracts = contractsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('📋 Contracts found:', contracts.length, contracts);
      
      // Test visits collection
      console.log('📅 Testing visits collection...');
      const visitsSnapshot = await getDocs(collection(db, 'visits'));
      const visits = visitsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('📅 Visits found:', visits.length, visits);
      
      setTestResults({
        companies,
        branches,
        contracts,
        visits,
        loading: false,
        error: null
      });
      
      console.log('✅ Firebase test completed successfully');
      
    } catch (error) {
      console.error('❌ Firebase test failed:', error);
      setTestResults(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Firebase Simple Test</h1>
        <Button onClick={testFirebaseConnection} disabled={testResults.loading}>
          {testResults.loading ? '🔄 Testing...' : '🧪 Test Firebase Connection'}
        </Button>
      </div>

      {testResults.error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">❌ Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{testResults.error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Companies */}
        <Card>
          <CardHeader>
            <CardTitle>🏢 Companies ({testResults.companies.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.companies.length === 0 ? (
              <p className="text-gray-500">No companies found</p>
            ) : (
              <div className="space-y-2">
                {testResults.companies.slice(0, 3).map((company: any) => (
                  <div key={company.id} className="p-2 bg-gray-50 rounded">
                    <p className="font-medium">{company.companyName || 'Unknown'}</p>
                    <p className="text-sm text-gray-600">ID: {company.companyId || company.id}</p>
                  </div>
                ))}
                {testResults.companies.length > 3 && (
                  <p className="text-sm text-gray-500">... and {testResults.companies.length - 3} more</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Branches */}
        <Card>
          <CardHeader>
            <CardTitle>🏪 Branches ({testResults.branches.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.branches.length === 0 ? (
              <p className="text-gray-500">No branches found</p>
            ) : (
              <div className="space-y-2">
                {testResults.branches.slice(0, 3).map((branch: any) => (
                  <div key={branch.id} className="p-2 bg-gray-50 rounded">
                    <p className="font-medium">{branch.branchName || 'Unknown'}</p>
                    <p className="text-sm text-gray-600">ID: {branch.branchId || branch.id}</p>
                  </div>
                ))}
                {testResults.branches.length > 3 && (
                  <p className="text-sm text-gray-500">... and {testResults.branches.length - 3} more</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contracts */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Contracts ({testResults.contracts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.contracts.length === 0 ? (
              <p className="text-gray-500">No contracts found</p>
            ) : (
              <div className="space-y-2">
                {testResults.contracts.slice(0, 3).map((contract: any) => (
                  <div key={contract.id} className="p-2 bg-gray-50 rounded">
                    <p className="font-medium">{contract.contractId || contract.id}</p>
                    <p className="text-sm text-gray-600">Company: {contract.companyId}</p>
                  </div>
                ))}
                {testResults.contracts.length > 3 && (
                  <p className="text-sm text-gray-500">... and {testResults.contracts.length - 3} more</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visits */}
        <Card>
          <CardHeader>
            <CardTitle>📅 Visits ({testResults.visits.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.visits.length === 0 ? (
              <p className="text-gray-500">No visits found</p>
            ) : (
              <div className="space-y-2">
                {testResults.visits.slice(0, 3).map((visit: any) => (
                  <div key={visit.id} className="p-2 bg-gray-50 rounded">
                    <p className="font-medium">Visit {visit.visitId || visit.id}</p>
                    <p className="text-sm text-gray-600">Date: {visit.scheduledDate}</p>
                    <p className="text-sm text-gray-600">Status: {visit.status}</p>
                  </div>
                ))}
                {testResults.visits.length > 3 && (
                  <p className="text-sm text-gray-500">... and {testResults.visits.length - 3} more</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Raw Data */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Raw Data Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify({
              companies: testResults.companies.length,
              branches: testResults.branches.length,
              contracts: testResults.contracts.length,
              visits: testResults.visits.length,
              timestamp: new Date().toISOString()
            }, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
} 