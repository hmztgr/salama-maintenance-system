'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useVisitsFirebase } from '@/hooks/useVisitsFirebase';
import { useBranchesFirebase } from '@/hooks/useBranchesFirebase';
import { fixInvalidDate, validateAndFixDate } from '@/lib/date-handler';

export function DataMigration() {
  const { visits, updateVisit, deleteVisit } = useVisitsFirebase();
  const { branches } = useBranchesFirebase();
  const [isMigrating, setIsMigrating] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [migrationResults, setMigrationResults] = useState<{
    totalVisits: number;
    invalidDates: number;
    fixedDates: number;
    errors: string[];
  } | null>(null);
  const [cleanupResults, setCleanupResults] = useState<{
    totalVisits: number;
    orphanedVisits: number;
    deletedVisits: number;
    errors: string[];
  } | null>(null);

  const fixInvalidDates = async () => {
    if (!visits || visits.length === 0) {
      alert('No visits found to migrate');
      return;
    }

    setIsMigrating(true);
    setMigrationResults(null);

    const results = {
      totalVisits: visits.length,
      invalidDates: 0,
      fixedDates: 0,
      errors: [] as string[]
    };

    try {
      // Find visits with invalid dates
      const visitsWithInvalidDates = visits.filter(visit => 
        !visit.scheduledDate || 
        visit.scheduledDate === 'Invalid Date' || 
        visit.scheduledDate === 'NaN'
      );

      results.invalidDates = visitsWithInvalidDates.length;

      console.log(`🔧 Found ${visitsWithInvalidDates.length} visits with invalid dates out of ${visits.length} total visits`);

      if (visitsWithInvalidDates.length === 0) {
        setMigrationResults(results);
        return;
      }

      // Fix each visit with invalid date
      for (const visit of visitsWithInvalidDates) {
        try {
          const { isValid, fixedDate, originalDate } = validateAndFixDate(visit.scheduledDate);
          
          if (!isValid) {
            console.log(`🔧 Fixing visit ${visit.id}: "${originalDate}" -> "${fixedDate}"`);
            
            const success = await updateVisit(visit.id, {
              scheduledDate: fixedDate
            });

            if (success) {
              results.fixedDates++;
            } else {
              results.errors.push(`Failed to update visit ${visit.id}`);
            }
          }
        } catch (error) {
          console.error('Error fixing visit:', visit.id, error);
          results.errors.push(`Error fixing visit ${visit.id}: ${error}`);
        }
      }

      console.log(`✅ Migration completed: ${results.fixedDates} dates fixed, ${results.errors.length} errors`);
      setMigrationResults(results);

    } catch (error) {
      console.error('Migration failed:', error);
      results.errors.push(`Migration failed: ${error}`);
      setMigrationResults(results);
    } finally {
      setIsMigrating(false);
    }
  };

  const cleanupOrphanedVisits = async () => {
    if (!visits || visits.length === 0) {
      alert('No visits found to clean up');
      return;
    }

    if (!branches || branches.length === 0) {
      alert('No branches found. Cannot determine orphaned visits.');
      return;
    }

    setIsCleaning(true);
    setCleanupResults(null);

    const results = {
      totalVisits: visits.length,
      orphanedVisits: 0,
      deletedVisits: 0,
      errors: [] as string[]
    };

    try {
      // Get all valid branch IDs
      const validBranchIds = new Set(branches.map(branch => branch.branchId));
      console.log(`🔍 Valid branch IDs: ${validBranchIds.size} branches`);

      // Find visits that reference non-existent branches
      const orphanedVisits = visits.filter(visit => !validBranchIds.has(visit.branchId));
      results.orphanedVisits = orphanedVisits.length;

      console.log(`🧹 Found ${orphanedVisits.length} orphaned visits out of ${visits.length} total visits`);

      if (orphanedVisits.length === 0) {
        setCleanupResults(results);
        return;
      }

      // Delete orphaned visits
      for (const visit of orphanedVisits) {
        try {
          console.log(`🗑️ Deleting orphaned visit ${visit.id} (branch: ${visit.branchId})`);
          
          const success = await deleteVisit(visit.id);

          if (success) {
            results.deletedVisits++;
          } else {
            results.errors.push(`Failed to delete visit ${visit.id}`);
          }
        } catch (error) {
          console.error('Error deleting visit:', visit.id, error);
          results.errors.push(`Error deleting visit ${visit.id}: ${error}`);
        }
      }

      console.log(`✅ Cleanup completed: ${results.deletedVisits} visits deleted, ${results.errors.length} errors`);
      setCleanupResults(results);

    } catch (error) {
      console.error('Cleanup failed:', error);
      results.errors.push(`Cleanup failed: ${error}`);
      setCleanupResults(results);
    } finally {
      setIsCleaning(false);
    }
  };

  const getInvalidDatesCount = () => {
    if (!visits) return 0;
    return visits.filter(visit => 
      !visit.scheduledDate || 
      visit.scheduledDate === 'Invalid Date' || 
      visit.scheduledDate === 'NaN'
    ).length;
  };

  const getOrphanedVisitsCount = () => {
    if (!visits || !branches) return 0;
    const validBranchIds = new Set(branches.map(branch => branch.branchId));
    return visits.filter(visit => !validBranchIds.has(visit.branchId)).length;
  };

  return (
    <div className="space-y-6">
      {/* Fix Invalid Dates Card */}
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Fix Invalid Dates</CardTitle>
          <CardDescription>
            Fix visits with invalid scheduled dates in the database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Total visits: {visits?.length || 0}
            </p>
            <p className="text-sm text-gray-600">
              Visits with invalid dates: {getInvalidDatesCount()}
            </p>
          </div>

          <Button 
            onClick={fixInvalidDates} 
            disabled={isMigrating || getInvalidDatesCount() === 0}
            className="w-full"
          >
            {isMigrating ? 'Fixing Invalid Dates...' : 'Fix Invalid Dates'}
          </Button>

          {migrationResults && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Migration Results:</h4>
              <div className="space-y-1 text-sm">
                <p>Total visits: {migrationResults.totalVisits}</p>
                <p>Invalid dates found: {migrationResults.invalidDates}</p>
                <p>Dates fixed: {migrationResults.fixedDates}</p>
                {migrationResults.errors.length > 0 && (
                  <div>
                    <p className="text-red-600">Errors: {migrationResults.errors.length}</p>
                    <ul className="text-red-600 text-xs mt-1">
                      {migrationResults.errors.slice(0, 5).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                      {migrationResults.errors.length > 5 && (
                        <li>... and {migrationResults.errors.length - 5} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cleanup Orphaned Visits Card */}
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Cleanup Orphaned Visits</CardTitle>
          <CardDescription>
            Remove visits that reference non-existent branches (old test data)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Total visits: {visits?.length || 0}
            </p>
            <p className="text-sm text-gray-600">
              Valid branches: {branches?.length || 0}
            </p>
            <p className="text-sm text-gray-600">
              Orphaned visits: {getOrphanedVisitsCount()}
            </p>
          </div>

          <Button 
            onClick={cleanupOrphanedVisits} 
            disabled={isCleaning || getOrphanedVisitsCount() === 0}
            variant="destructive"
            className="w-full"
          >
            {isCleaning ? 'Cleaning Up...' : 'Cleanup Orphaned Visits'}
          </Button>

          {cleanupResults && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Cleanup Results:</h4>
              <div className="space-y-1 text-sm">
                <p>Total visits: {cleanupResults.totalVisits}</p>
                <p>Orphaned visits found: {cleanupResults.orphanedVisits}</p>
                <p>Visits deleted: {cleanupResults.deletedVisits}</p>
                {cleanupResults.errors.length > 0 && (
                  <div>
                    <p className="text-red-600">Errors: {cleanupResults.errors.length}</p>
                    <ul className="text-red-600 text-xs mt-1">
                      {cleanupResults.errors.slice(0, 5).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                      {cleanupResults.errors.length > 5 && (
                        <li>... and {cleanupResults.errors.length - 5} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 