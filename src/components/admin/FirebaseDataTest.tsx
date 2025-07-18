'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Trash2,
  Edit,
  Building,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Database,
  Eye
} from 'lucide-react';
import { useCompaniesFirebase } from '@/hooks/useCompaniesFirebase';

export function FirebaseDataTest() {
  const { companies, loading, error, addCompany, deleteCompany, updateCompany } = useCompaniesFirebase();

  const [isAdding, setIsAdding] = useState(false);
  const [newCompanyData, setNewCompanyData] = useState({
    companyName: '',
    email: '',
    phone: '',
    address: '',
    contactPerson: ''
  });
  const [operationResult, setOperationResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleAddCompany = async () => {
    if (!newCompanyData.companyName.trim()) {
      setOperationResult({
        type: 'error',
        message: 'اسم الشركة مطلوب'
      });
      return;
    }

    setIsAdding(true);
    setOperationResult(null);

    try {
      const result = await addCompany({
        companyName: newCompanyData.companyName,
        email: newCompanyData.email,
        phone: newCompanyData.phone,
        address: newCompanyData.address,
        contactPerson: newCompanyData.contactPerson,
      });

      if (result.success) {
        setOperationResult({
          type: 'success',
          message: `تم إضافة الشركة "${newCompanyData.companyName}" بنجاح إلى Firebase!`
        });
        setNewCompanyData({
          companyName: '',
          email: '',
          phone: '',
          address: '',
          contactPerson: ''
        });
      } else {
        setOperationResult({
          type: 'error',
          message: result.warnings?.join(', ') || 'فشل في إضافة الشركة'
        });
      }
    } catch (error) {
      setOperationResult({
        type: 'error',
        message: `خطأ: ${error}`
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    if (!confirm(`هل أنت متأكد من حذف الشركة "${companyName}"؟`)) {
      return;
    }

    try {
      const success = await deleteCompany(companyId);
      if (success) {
        setOperationResult({
          type: 'success',
          message: `تم حذف الشركة "${companyName}" من Firebase!`
        });
      } else {
        setOperationResult({
          type: 'error',
          message: 'فشل في حذف الشركة'
        });
      }
    } catch (error) {
      setOperationResult({
        type: 'error',
        message: `خطأ في الحذف: ${error}`
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">جاري تحميل البيانات من Firebase...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">اختبار بيانات Firebase</h2>
        <p className="text-gray-600">
          اختبار عمليات CRUD مع قاعدة بيانات Firestore مباشرة
        </p>
      </div>

      {/* Connection Status */}
      <Alert className={error ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
        <Database className={`h-4 w-4 ${error ? 'text-red-600' : 'text-green-600'}`} />
        <AlertDescription className={error ? 'text-red-700' : 'text-green-700'}>
          {error ? (
            <><strong>خطأ في الاتصال:</strong> {error}</>
          ) : (
            <><strong>متصل بـ Firebase:</strong> تم تحميل {companies.length} شركة من Firestore</>
          )}
        </AlertDescription>
      </Alert>

      {/* Operation Result */}
      {operationResult && (
        <Alert className={operationResult.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {operationResult.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={operationResult.type === 'success' ? 'text-green-700' : 'text-red-700'}>
            {operationResult.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Add New Company */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            إضافة شركة جديدة إلى Firebase
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyName">اسم الشركة *</Label>
              <Input
                id="companyName"
                value={newCompanyData.companyName}
                onChange={(e) => setNewCompanyData(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="شركة الاختبار المحدودة"
              />
            </div>
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={newCompanyData.email}
                onChange={(e) => setNewCompanyData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="info@test-company.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                value={newCompanyData.phone}
                onChange={(e) => setNewCompanyData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="0112345678"
              />
            </div>
            <div>
              <Label htmlFor="address">العنوان</Label>
              <Input
                id="address"
                value={newCompanyData.address}
                onChange={(e) => setNewCompanyData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="الرياض، السعودية"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="contactPerson">الشخص المسؤول</Label>
              <Input
                id="contactPerson"
                value={newCompanyData.contactPerson}
                onChange={(e) => setNewCompanyData(prev => ({ ...prev, contactPerson: e.target.value }))}
                placeholder="أحمد محمد"
              />
            </div>
          </div>

          <div className="mt-4">
            <Button
              onClick={handleAddCompany}
              disabled={isAdding}
              className="flex items-center gap-2"
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {isAdding ? 'جاري الإضافة...' : 'إضافة إلى Firebase'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Companies List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            الشركات المحفوظة في Firebase ({companies.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>لا توجد شركات في Firebase بعد</p>
              <p className="text-sm">أضف شركة باستخدام النموذج أعلاه لاختبار Firebase</p>
            </div>
          ) : (
            <div className="space-y-3">
              {companies.map((company) => (
                <div key={company.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{company.companyName}</h4>
                    <div className="text-sm text-gray-500 mt-1">
                      <span>ID: {company.companyId}</span>
                      {company.email && <span> • {company.email}</span>}
                      {company.phone && <span> • {company.phone}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCompany(company.companyId, company.companyName)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Firebase Integration Note */}
      <Alert className="border-blue-200 bg-blue-50">
        <Database className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          <strong>اختبار Firebase:</strong> هذه البيانات محفوظة مباشرة في Firestore، وليس في التخزين المحلي.
          يمكنك رؤية التحديثات في الوقت الفعلي ومشاركتها مع مستخدمين آخرين.
        </AlertDescription>
      </Alert>
    </div>
  );
}
