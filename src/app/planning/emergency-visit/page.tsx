'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, AlertTriangle, Plus, X } from 'lucide-react';
import { doc, addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { FileUpload } from '@/components/common/FileUpload';
import { UploadedFile } from '@/hooks/useFirebaseStorage';

function EmergencyVisitContent() {
  const searchParams = useSearchParams();
  const preFilledDate = searchParams.get('date');
  const preFilledDay = searchParams.get('day');
  const preFilledDayName = searchParams.get('dayName');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form data
  const [emergencyDate, setEmergencyDate] = useState('');
  const [emergencyTime, setEmergencyTime] = useState('');
  const [customerComplaints, setCustomerComplaints] = useState<string[]>([]);
  const [newComplaint, setNewComplaint] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [reportedBy, setReportedBy] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [users, setUsers] = useState<Array<{id: string, fullName: string, email: string}>>([]);
  const [branches, setBranches] = useState<Array<{id: string, name: string}>>([]);
  const [companies, setCompanies] = useState<Array<{id: string, name: string}>>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [emergencyTicketNumber, setEmergencyTicketNumber] = useState('');

  // Handle files uploaded
  const handleFilesUploaded = (files: UploadedFile[]) => {
    console.log('📁 Files uploaded to emergency form:', files);
    setAttachments(files);
  };

  // Handle file deleted
  const handleFileDeleted = (filePath: string) => {
    console.log('🗑️ File deleted from emergency form:', filePath);
    setAttachments(prev => prev.filter(file => file.path !== filePath));
  };

  // Generate emergency ticket number
  const generateEmergencyTicketNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `EMG-${timestamp}-${random}`;
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);

        // Set pre-filled date if provided
        if (preFilledDate) {
          const date = new Date(preFilledDate);
          setEmergencyDate(date.toISOString().split('T')[0]);
          setEmergencyTime(date.toTimeString().split(' ')[0].substring(0, 5));
        } else {
          // Set default to today
          const today = new Date().toISOString().split('T')[0];
          setEmergencyDate(today);
          setEmergencyTime(new Date().toTimeString().split(' ')[0].substring(0, 5));
        }

        // Generate emergency ticket number
        setEmergencyTicketNumber(generateEmergencyTicketNumber());

        // Load branches
        const branchesQuery = query(collection(db, 'branches'));
        const branchesSnapshot = await getDocs(branchesQuery);
        const branchesData = branchesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || 'Unknown Branch'
        }));
        setBranches(branchesData);

        // Load companies
        const companiesQuery = query(collection(db, 'companies'));
        const companiesSnapshot = await getDocs(companiesQuery);
        const companiesData = companiesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || 'Unknown Company'
        }));
        setCompanies(companiesData);

        // Load users
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          fullName: doc.data().fullName || 'Unknown User',
          email: doc.data().email || ''
        }));
        setUsers(usersData);

      } catch (error) {
        console.error('Error loading initial data:', error);
        setError('فشل في تحميل البيانات الأولية');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [preFilledDate]);

  // Add complaint
  const addComplaint = () => {
    if (newComplaint.trim()) {
      setCustomerComplaints(prev => [...prev, newComplaint.trim()]);
      setNewComplaint('');
    }
  };

  // Remove complaint
  const removeComplaint = (index: number) => {
    setCustomerComplaints(prev => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emergencyDate || !selectedBranch || !selectedCompany || customerComplaints.length === 0) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Create emergency visit document
      const emergencyVisitData = {
        type: 'emergency',
        status: 'scheduled',
        emergencyTicketNumber,
        scheduledDate: emergencyDate,
        scheduledTime: emergencyTime,
        priority,
        customerComplaints,
        reportedBy: reportedBy || 'غير محدد',
        contactNumber: contactNumber || 'غير محدد',
        branchId: selectedBranch,
        companyId: selectedCompany,
        attachments: attachments.map(file => ({
          name: file.name,
          url: file.url,
          path: file.path,
          size: file.size,
          type: file.type
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'مستخدم النظام'
      };

      console.log('📝 Creating emergency visit:', emergencyVisitData);
      
      // Add to visits collection
      const visitRef = await addDoc(collection(db, 'visits'), emergencyVisitData);
      console.log('✅ Emergency visit created with ID:', visitRef.id);

      // Log the emergency visit creation
      const emergencyLog = {
        visitId: visitRef.id,
        emergencyTicketNumber,
        createdAt: new Date().toISOString(),
        createdBy: 'مستخدم النظام',
        action: 'emergency_created',
        priority,
        customerComplaints,
        reportedBy: reportedBy || 'غير محدد'
      };

      // Save emergency log to Firestore
      try {
        await addDoc(collection(db, 'visitLogs'), emergencyLog);
        console.log('Emergency visit creation logged to Firestore:', emergencyLog);
      } catch (error) {
        console.error('Error logging emergency visit creation:', error);
      }

      setSuccess(true);
      
      // Redirect back to main dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);

    } catch (error) {
      console.error('Error creating emergency visit:', error);
      setError('فشل في إنشاء الزيارة الطارئة');
    } finally {
      setSaving(false);
    }
  };

  // Handle go back
  const handleGoBack = () => {
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">جاري تحميل البيانات...</div>
        </div>
      </div>
    );
  }

  if (error && !success) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={handleGoBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          العودة
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            تم إنشاء الزيارة الطارئة بنجاح. رقم التذكرة: {emergencyTicketNumber}
            <br />
            سيتم توجيهك إلى الصفحة الرئيسية...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إنشاء زيارة طارئة</h1>
            <p className="text-gray-600 mt-2">
              إنشاء زيارة طارئة جديدة مع رقم تذكرة تلقائي
            </p>
          </div>
          <Button onClick={handleGoBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة
          </Button>
        </div>

        {/* Emergency Ticket Number */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              رقم التذكرة الطارئة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono text-red-600 bg-red-50 p-4 rounded-lg text-center">
              {emergencyTicketNumber}
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date and Time */}
            <Card>
              <CardHeader>
                <CardTitle>التاريخ والوقت</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="emergencyDate">تاريخ الطوارئ *</Label>
                  <Input
                    id="emergencyDate"
                    type="date"
                    value={emergencyDate}
                    onChange={(e) => setEmergencyDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyTime">وقت الطوارئ</Label>
                  <Input
                    id="emergencyTime"
                    type="time"
                    value={emergencyTime}
                    onChange={(e) => setEmergencyTime(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Priority and Contact */}
            <Card>
              <CardHeader>
                <CardTitle>الأولوية ومعلومات الاتصال</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="priority">مستوى الأولوية *</Label>
                  <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفضة</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="high">عالية</SelectItem>
                      <SelectItem value="critical">حرجة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="reportedBy">أبلغ عن طريق</Label>
                  <Input
                    id="reportedBy"
                    value={reportedBy}
                    onChange={(e) => setReportedBy(e.target.value)}
                    placeholder="اسم الشخص الذي أبلغ عن الطوارئ"
                  />
                </div>
                <div>
                  <Label htmlFor="contactNumber">رقم الاتصال</Label>
                  <Input
                    id="contactNumber"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="رقم الهاتف للاتصال"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Branch and Company */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>الفرع والشركة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="company">الشركة *</Label>
                  <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الشركة" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map(company => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="branch">الفرع *</Label>
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفرع" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Customer Complaints */}
            <Card>
              <CardHeader>
                <CardTitle>شكاوى العميل *</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newComplaint}
                    onChange={(e) => setNewComplaint(e.target.value)}
                    placeholder="أضف شكوى جديدة"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addComplaint())}
                  />
                  <Button type="button" onClick={addComplaint} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {customerComplaints.map((complaint, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <span className="flex-1 text-sm">{complaint}</span>
                      <Button
                        type="button"
                        onClick={() => removeComplaint(index)}
                        size="sm"
                        variant="ghost"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>المرفقات</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFilesUploaded={handleFilesUploaded}
                onFileDeleted={handleFileDeleted}
                maxFiles={5}
                acceptedTypes={['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button type="button" onClick={handleGoBack} variant="outline">
              إلغاء
            </Button>
            <Button type="submit" disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? 'جاري الإنشاء...' : 'إنشاء الزيارة الطارئة'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EmergencyVisitPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">جاري التحميل...</div>
        </div>
      </div>
    }>
      <EmergencyVisitContent />
    </Suspense>
  );
} 