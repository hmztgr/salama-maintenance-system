'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Database,
  Upload,
  Download,
  CheckCircle,
  AlertTriangle,
  Loader2,
  FileText,
  Users,
  Building,
  Calendar,
  Zap
} from 'lucide-react';
import { migrateFromLocalStorage, verifyMigration, backupLocalStorageData } from '@/lib/firebase/migration';

interface MigrationStats {
  companies: number;
  contracts: number;
  branches: number;
  visits: number;
  invitations: number;
}

export function FirebaseMigration() {
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'backing_up' | 'migrating' | 'verifying' | 'complete' | 'error'>('idle');
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [migrationStep, setMigrationStep] = useState('');
  const [migrationResults, setMigrationResults] = useState<MigrationStats | null>(null);
  const [verificationResults, setVerificationResults] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backupData, setBackupData] = useState<string | null>(null);

  const startMigration = async () => {
    try {
      setMigrationStatus('backing_up');
      setMigrationStep('إنشاء نسخة احتياطية من بيانات localStorage...');
      setMigrationProgress(10);
      setError(null);

      // Step 1: Create backup
      const backup = backupLocalStorageData();
      setBackupData(backup);
      console.log('💾 Backup created successfully');

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Start migration
      setMigrationStatus('migrating');
      setMigrationStep('ترحيل البيانات إلى Firebase Firestore...');
      setMigrationProgress(30);

      const migrationResult = await migrateFromLocalStorage();

      if (!migrationResult.success) {
        throw new Error(migrationResult.error || 'فشل في الترحيل');
      }

      setMigrationResults(migrationResult.details || null);
      setMigrationProgress(70);

      // Step 3: Verification
      setMigrationStatus('verifying');
      setMigrationStep('التحقق من البيانات المرحلة...');
      setMigrationProgress(80);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const verification = await verifyMigration();
      setVerificationResults(verification);
      setMigrationProgress(100);

      // Step 4: Complete
      setMigrationStatus('complete');
      setMigrationStep('تم الترحيل بنجاح!');

      console.log('✅ Migration completed successfully');

    } catch (error: any) {
      console.error('❌ Migration failed:', error);
      setMigrationStatus('error');
      setError(error.message || 'حدث خطأ أثناء الترحيل');
    }
  };

  const downloadBackup = () => {
    if (!backupData) return;

    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `localStorage-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = () => {
    switch (migrationStatus) {
      case 'complete':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-6 w-6 text-red-600" />;
      case 'idle':
        return <Database className="h-6 w-6 text-blue-600" />;
      default:
        return <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (migrationStatus) {
      case 'complete':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'idle':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">ترحيل البيانات إلى Firebase</h2>
        <p className="text-gray-600">
          نقل جميع البيانات من التخزين المحلي إلى قاعدة بيانات Firebase
        </p>
      </div>

      {/* Migration Status Card */}
      <Card className={getStatusColor()}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            حالة الترحيل
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{migrationStep || 'جاهز للبدء'}</span>
                <span className="text-sm text-gray-500">{migrationProgress}%</span>
              </div>
              <Progress value={migrationProgress} className="h-2" />
            </div>

            {migrationStatus === 'idle' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>تنبيه:</strong> سيتم نقل جميع البيانات الموجودة في التخزين المحلي إلى Firebase.
                  تأكد من أن لديك اتصال بالإنترنت قبل البدء.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  <strong>خطأ:</strong> {error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Migration Results */}
      {migrationResults && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              نتائج الترحيل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <Building className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold text-green-800">{migrationResults.companies}</div>
                <div className="text-sm text-green-600">شركة</div>
              </div>
              <div className="text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold text-green-800">{migrationResults.contracts}</div>
                <div className="text-sm text-green-600">عقد</div>
              </div>
              <div className="text-center">
                <Building className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold text-green-800">{migrationResults.branches}</div>
                <div className="text-sm text-green-600">فرع</div>
              </div>
              <div className="text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <div className="text-2xl font-bold text-green-800">{migrationResults.visits}</div>
                <div className="text-sm text-green-600">زيارة</div>
              </div>
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-pink-600" />
                <div className="text-2xl font-bold text-green-800">{migrationResults.invitations}</div>
                <div className="text-sm text-green-600">دعوة</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Results */}
      {verificationResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              التحقق من البيانات في Firebase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(verificationResults).map(([collection, count]) => (
                <div key={collection} className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-600 capitalize">{collection}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        {migrationStatus === 'idle' && (
          <Button
            onClick={startMigration}
            className="flex items-center gap-2"
            size="lg"
          >
            <Upload className="h-5 w-5" />
            بدء ترحيل البيانات
          </Button>
        )}

        {backupData && (
          <Button
            variant="outline"
            onClick={downloadBackup}
            className="flex items-center gap-2"
          >
            <Download className="h-5 w-5" />
            تحميل النسخة الاحتياطية
          </Button>
        )}

        {migrationStatus === 'complete' && (
          <Alert className="max-w-2xl mx-auto">
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <strong>تم بنجاح!</strong> تم ترحيل جميع البيانات إلى Firebase.
              يمكنك الآن الاستفادة من ميزات Firebase مثل التزامن في الوقت الفعلي والنسخ الاحتياطي التلقائي.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Help Section */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <h4 className="font-medium text-blue-900 mb-2">ما يتم ترحيله:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• جميع بيانات الشركات والعقود والفروع</li>
            <li>• سجل الزيارات المكتملة والمجدولة</li>
            <li>• دعوات المستخدمين وإعدادات النظام</li>
            <li>• إنشاء نسخة احتياطية آمنة قبل الترحيل</li>
            <li>• التحقق من سلامة البيانات بعد الترحيل</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
