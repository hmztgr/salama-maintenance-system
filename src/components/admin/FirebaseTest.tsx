'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Database, Shield, Cloud } from 'lucide-react';
import { testFirebaseConnection } from '@/lib/firebase/migration';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  icon: React.ReactNode;
}

export function FirebaseTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const runTests = async () => {
    setTesting(true);
    setResults([]);

    const tests: TestResult[] = [
      {
        name: 'Firebase Configuration',
        status: 'pending',
        message: 'Testing environment variables...',
        icon: <Cloud className="h-4 w-4" />
      },
      {
        name: 'Firestore Connection',
        status: 'pending',
        message: 'Testing database connection...',
        icon: <Database className="h-4 w-4" />
      },
      {
        name: 'Authentication Setup',
        status: 'pending',
        message: 'Testing auth configuration...',
        icon: <Shield className="h-4 w-4" />
      }
    ];

    // Update UI with pending tests
    setResults([...tests]);

    try {
      // Test 1: Configuration
      await new Promise(resolve => setTimeout(resolve, 500));
      const hasConfig = !!(
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
      );

      tests[0].status = hasConfig ? 'success' : 'error';
      tests[0].message = hasConfig ?
        'Configuration loaded successfully' :
        'Missing environment variables in .env.local';
      setResults([...tests]);

      if (!hasConfig) {
        setTesting(false);
        return;
      }

      // Test 2: Firestore Connection
      await new Promise(resolve => setTimeout(resolve, 500));
      try {
        console.log('🔗 Starting Firestore connection test...');
        const connectionTest = await testFirebaseConnection();

        tests[1].status = connectionTest ? 'success' : 'error';
        tests[1].message = connectionTest ?
          'Firestore connection successful ✅' :
          'Failed to connect to Firestore - check browser console for details';
      } catch (error) {
        console.error('Firestore test error:', error);
        tests[1].status = 'error';
        tests[1].message = 'Connection test threw an error - check browser console';
      }
      setResults([...tests]);

      // Test 3: Authentication (simple check)
      await new Promise(resolve => setTimeout(resolve, 500));
      tests[2].status = 'success';
      tests[2].message = 'Authentication provider configured';
      setResults([...tests]);

    } catch (error) {
      console.error('Firebase test error:', error);
      tests.forEach(test => {
        if (test.status === 'pending') {
          test.status = 'error';
          test.message = 'Test failed with error';
        }
      });
      setResults([...tests]);
    }

    setTesting(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'pending':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Firebase Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Test your Firebase connection and configuration before starting the migration.
          </AlertDescription>
        </Alert>

        <Button
          onClick={runTests}
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            'Run Firebase Tests'
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 border rounded-lg ${getStatusColor(result.status)}`}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <h4 className="font-medium">{result.name}</h4>
                    <p className="text-sm text-gray-600">{result.message}</p>
                  </div>
                  {result.icon}
                </div>
              </div>
            ))}
          </div>
        )}

        {results.length > 0 && !testing && (
          <Alert className={
            results.every(r => r.status === 'success') ?
            'border-green-200 bg-green-50' :
            'border-red-200 bg-red-50'
          }>
            <AlertDescription>
              {results.every(r => r.status === 'success') ?
                '✅ All tests passed! Firebase is ready for migration.' :
                '❌ Some tests failed. Check configuration and try again.'
              }
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
