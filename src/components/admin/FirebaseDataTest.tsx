'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContextFirebase';
import { useCompaniesFirebase } from '@/hooks/useCompaniesFirebase';
import { useBranchesFirebase } from '@/hooks/useBranchesFirebase';
import { useContractsFirebase } from '@/hooks/useContractsFirebase';
import { useVisitsFirebase } from '@/hooks/useVisitsFirebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function FirebaseDataTest() {
  const { authState } = useAuth();
  const { companies, loading: companiesLoading, error: companiesError } = useCompaniesFirebase();
  const { branches, loading: branchesLoading, error: branchesError } = useBranchesFirebase();
  const { contracts, loading: contractsLoading, error: contractsError } = useContractsFirebase();
  const { visits, loading: visitsLoading, error: visitsError } = useVisitsFirebase();
  
  const [refreshCount, setRefreshCount] = useState(0);

  const refreshData = () => {
    setRefreshCount(prev => prev + 1);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Firebase Data Test</h1>
        <Button onClick={refreshData}>🔄 Refresh Data</Button>
      </div>

      {/* Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle>🔐 Authentication Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Is Authenticated:</strong> {authState.isAuthenticated ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Is Loading:</strong> {authState.isLoading ? '⏳ Yes' : '✅ No'}</p>
            <p><strong>User:</strong> {authState.user?.displayName || 'None'}</p>
            <p><strong>User ID:</strong> {authState.user?.uid || 'None'}</p>
            <p><strong>Error:</strong> {authState.error || 'None'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Companies Data */}
      <Card>
        <CardHeader>
          <CardTitle>🏢 Companies Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {companiesLoading ? '⏳ Yes' : '✅ No'}</p>
            <p><strong>Count:</strong> {companies.length}</p>
            <p><strong>Error:</strong> {companiesError || 'None'}</p>
            {companies.length > 0 && (
              <div className="mt-4">
                <p><strong>Sample Companies:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  {companies.slice(0, 3).map(company => (
                    <li key={company.id}>
                      {company.companyName} (ID: {company.companyId})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Branches Data */}
      <Card>
        <CardHeader>
          <CardTitle>🏪 Branches Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {branchesLoading ? '⏳ Yes' : '✅ No'}</p>
            <p><strong>Count:</strong> {branches.length}</p>
            <p><strong>Error:</strong> {branchesError || 'None'}</p>
            {branches.length > 0 && (
              <div className="mt-4">
                <p><strong>Sample Branches:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  {branches.slice(0, 3).map(branch => (
                    <li key={branch.id}>
                      {branch.branchName} (Company: {branch.companyId})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contracts Data */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Contracts Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {contractsLoading ? '⏳ Yes' : '✅ No'}</p>
            <p><strong>Count:</strong> {contracts.length}</p>
            <p><strong>Error:</strong> {contractsError || 'None'}</p>
            {contracts.length > 0 && (
              <div className="mt-4">
                <p><strong>Sample Contracts:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                                     {contracts.slice(0, 3).map(contract => (
                     <li key={contract.id}>
                       {contract.contractId} (Company: {contract.companyId})
                     </li>
                   ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Visits Data */}
      <Card>
        <CardHeader>
          <CardTitle>📅 Visits Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {visitsLoading ? '⏳ Yes' : '✅ No'}</p>
            <p><strong>Count:</strong> {visits.length}</p>
            <p><strong>Error:</strong> {visitsError || 'None'}</p>
            {visits.length > 0 && (
              <div className="mt-4">
                <p><strong>Sample Visits:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  {visits.slice(0, 3).map(visit => (
                    <li key={visit.id}>
                      {visit.branchId} - {visit.scheduledDate} (Status: {visit.status})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>🐛 Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Refresh Count:</strong> {refreshCount}</p>
            <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
            <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
            <p><strong>Firebase Project:</strong> {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'salama-maintenance-prod'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
