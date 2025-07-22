'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useVisitsFirebase } from '@/hooks/useVisitsFirebase';
import { fixInvalidDate, validateAndFixDate } from '@/lib/date-handler';

export function DataMigration() {
  const { visits, updateVisit } = useVisitsFirebase();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResults, setMigrationResults] = useState<{
    totalVisits: number;
    invalidDates: number;
    fixedDates: number;
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

  const getInvalidDatesCount = () => {
    if (!visits) return 0;
    return visits.filter(visit => 
      !visit.scheduledDate || 
      visit.scheduledDate === 'Invalid Date' || 
      visit.scheduledDate === 'NaN'
    ).length;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Data Migration - Fix Invalid Dates</CardTitle>
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
  );
} 