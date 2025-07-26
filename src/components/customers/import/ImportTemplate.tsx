'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, FileText, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { ImportReview } from './ImportReview';

// Firebase integration for saving imported data
import { useCompaniesFirebase } from '@/hooks/useCompaniesFirebase';
import { useContractsFirebase } from '@/hooks/useContractsFirebase';
import { useBranchesFirebase } from '@/hooks/useBranchesFirebase';

interface ImportTemplateProps {
  entityType: 'companies' | 'contracts' | 'contractsAdvanced' | 'branches';
  onClose: () => void;
}

interface ImportResults {
  totalRows: number;
  successfulRows: number;
  errorRows: number;
  warningRows: number;
  importedData: Record<string, string>[];
}

export function ImportTemplate({ entityType, onClose }: ImportTemplateProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);

  // Firebase hooks for saving imported data
  const { addCompany, companies: existingCompanies } = useCompaniesFirebase();
  const { addContract } = useContractsFirebase(); 
  const { addBranch } = useBranchesFirebase();

  // Template configurations for different entity types
  const templateConfigs = {
    companies: {
      title: 'استيراد بيانات الشركات',
      description: 'قالب لاستيراد بيانات الشركات مع قواعد التحقق والأمثلة',
      headers: [
        'companyName',
        'email',
        'phone',
        'address',
        'city',
        'contactPerson',
        'notes'
      ],
      headerLabels: [
        'اسم الشركة*',
        'البريد الإلكتروني',
        'رقم الهاتف*',
        'العنوان*',
        'المدينة*',
        'الشخص المسؤول',
        'ملاحظات'
      ],
      sampleData: [
        'شركة السلامة المحدودة',
        'info@salama.com',
        '0112345678',
        'طريق الملك فهد، حي الملز',
        'الرياض',
        'أحمد محمد',
        'شركة رائدة في مجال السلامة'
      ],
      validationRules: [
        'اسم الشركة: مطلوب، أقل من 100 حرف',
        'البريد الإلكتروني: تنسيق email صحيح',
        'رقم الهاتف: مطلوب، أرقام ورموز فقط',
        'العنوان: مطلوب، أقل من 200 حرف',
        'المدينة: مطلوب، يجب أن تكون من المدن السعودية',
        'الشخص المسؤول: اختياري، أقل من 100 حرف',
        'ملاحظات: اختياري، أقل من 500 حرف'
      ]
    },
    contracts: {
      title: 'استيراد بيانات العقود (بسيط)',
      description: 'قالب لاستيراد بيانات العقود البسيطة مع تواريخ وخدمات السلامة',
      headers: [
        'companyId',
        'contractStartDate',
        'contractEndDate',
        'regularVisitsPerYear',
        'emergencyVisitsPerYear',
        'contractValue',
        'fireExtinguisherMaintenance',
        'alarmSystemMaintenance',
        'fireSuppressionMaintenance',
        'gasFireSuppression',
        'foamFireSuppression',
        'notes'
      ],
      headerLabels: [
        'معرف الشركة*',
        'تاريخ بداية العقد*',
        'تاريخ انتهاء العقد*',
        'عدد الزيارات العادية سنوياً*',
        'عدد الزيارات الطارئة سنوياً*',
        'قيمة العقد',
        'صيانة الطفايات*',
        'صيانة نظام الإنذار*',
        'صيانة نظام الإطفاء*',
        'نظام الإطفاء بالغاز*',
        'نظام الإطفاء بالفوم*',
        'ملاحظات'
      ],
      sampleData: [
        '0001',
        '01-Jan-2024',
        '31-Dec-2024',
        '12',
        '4',
        '50000',
        'نعم',
        'نعم',
        'لا',
        'لا',
        'لا',
        'عقد صيانة سنوي شامل'
      ],
      validationRules: [
        'معرف الشركة: مطلوب، يجب أن يكون موجود في النظام',
        'تاريخ بداية العقد: مطلوب، تنسيق d-mmm-yyyy أو dd-mmm-yyyy أو d-mmm-yy أو dd-mmm-yy (مثال: 1-Sep-2024 أو 01-Sep-2024 أو 1-Sep-24 أو 01-Sep-24)',
        'تاريخ انتهاء العقد: مطلوب، يجب أن يكون بعد تاريخ البداية',
        'عدد الزيارات العادية: مطلوب، رقم من 0 إلى 365',
        'عدد الزيارات الطارئة: مطلوب، رقم من 0 إلى 365',
        'قيمة العقد: اختياري، رقم موجب',
        'خدمات السلامة: نعم/لا، يجب اختيار خدمة واحدة على الأقل',
        'ملاحظات: اختياري، أقل من 500 حرف'
      ]
    },
    contractsAdvanced: {
      title: 'استيراد بيانات العقود (متقدم)',
      description: 'قالب لاستيراد بيانات العقود المتقدمة مع مجموعات الخدمات والفروع',
      headers: [
        'companyId',
        'contractStartDate',
        'contractEndDate',
        'contractPeriodMonths',
        'contractValue',
        'branchIds',
        'fireExtinguisherMaintenance',
        'alarmSystemMaintenance',
        'fireSuppressionMaintenance',
        'gasFireSuppression',
        'foamFireSuppression',
        'regularVisitsPerYear',
        'emergencyVisitsPerYear',
        'emergencyVisitCost',
        'batchNotes',
        'contractNotes'
      ],
      headerLabels: [
        'معرف الشركة*',
        'تاريخ بداية العقد*',
        'تاريخ انتهاء العقد',
        'مدة العقد بالأشهر',
        'قيمة العقد',
        'معرفات الفروع*',
        'صيانة الطفايات',
        'صيانة نظام الإنذار',
        'صيانة نظام الإطفاء',
        'نظام الإطفاء بالغاز',
        'نظام الإطفاء بالفوم',
        'عدد الزيارات العادية سنوياً*',
        'عدد الزيارات الطارئة سنوياً',
        'تكلفة الزيارة الطارئة',
        'ملاحظات المجموعة',
        'ملاحظات العقد'
      ],
      sampleData: [
        '0001',
        '01-Jan-2024',
        '31-Dec-2024',
        '12',
        '50000',
        '0001-JED-001-0001,0001-JED-001-0002',
        'نعم',
        'نعم',
        'لا',
        'لا',
        'لا',
        '12',
        '4',
        '500',
        'مجموعة خدمات الفروع الرئيسية',
        'عقد صيانة سنوي شامل للفروع الرئيسية'
      ],
      validationRules: [
        'معرف الشركة: مطلوب، يجب أن يكون موجود في النظام',
        'تاريخ بداية العقد: مطلوب، تنسيق d-mmm-yyyy أو dd-mmm-yyyy أو d-mmm-yy أو dd-mmm-yy (مثال: 1-Sep-2024 أو 01-Sep-2024 أو 1-Sep-24 أو 01-Sep-24)',
        'تاريخ انتهاء العقد أو مدة العقد: أحدهما مطلوب',
        'معرفات الفروع: مطلوب، مفصولة بفاصلة، يجب أن تكون موجودة',
        'خدمات السلامة: يجب اختيار خدمة واحدة على الأقل',
        'عدد الزيارات العادية: مطلوب، رقم من 0 إلى 365',
        'عدد الزيارات الطارئة: اختياري، رقم من 0 إلى 365',
        'تكلفة الزيارة الطارئة: اختياري، رقم موجب',
        'ملاحظات المجموعة: اختياري، أقل من 500 حرف',
        'ملاحظات العقد: اختياري، أقل من 500 حرف'
      ]
    },
    branches: {
      title: 'استيراد بيانات الفروع',
      description: 'قالب لاستيراد بيانات الفروع مع المواقع وتفاصيل التواصل',
      headers: [
        'companyId',
        'companyName',
        'city',
        'location',
        'branchName',
        'address',
        'contactPerson',
        'contactPhone',
        'teamMember',
        'notes'
      ],
      headerLabels: [
        'معرف الشركة***',
        'اسم الشركة**',
        'المدينة*',
        'الموقع*',
        'اسم الفرع*',
        'العنوان التفصيلي',
        'الشخص المسؤول',
        'هاتف التواصل',
        'فريق العمل المختص',
        'ملاحظات'
      ],
      sampleData: [
        '0001',
        'شركة سلامة السعودية',
        'الرياض',
        'حي الملز',
        'الفرع الرئيسي',
        'طريق الملك فهد، مبنى رقم 123',
        'سالم أحمد',
        '0501234567',
        'فريق الرياض',
        'الفرع الرئيسي للشركة'
      ],
      validationRules: [
        'معرف الشركة أو اسم الشركة: مطلوب أحدهما على الأقل، يجب أن يكون موجود في النظام',
        'المدينة: مطلوب، يجب أن تكون من المدن السعودية',
        'الموقع: مطلوب، أقل من 100 حرف',
        'اسم الفرع: مطلوب، أقل من 100 حرف',
        'العنوان التفصيلي: اختياري، أقل من 200 حرف',
        'الشخص المسؤول: اختياري، أقل من 100 حرف',
        'هاتف التواصل: اختياري، أرقام ورموز فقط',
        'فريق العمل: اختياري، أقل من 100 حرف',
        'ملاحظات: اختياري، أقل من 500 حرف'
      ]
    }
  };

  const currentConfig = templateConfigs[entityType];

  const generateCSVTemplate = () => {
    setIsGenerating(true);

    try {
      // Create clean CSV content with UTF-8 BOM for Arabic support
      const BOM = '\uFEFF';

      let content = `${BOM}`;

      // Add headers
      content += currentConfig.headerLabels.join(',') + '\n';

      // Add sample data
      content += currentConfig.sampleData.map(field => `"${field}"`).join(',') + '\n';

      // Add empty rows for user input
      for (let i = 0; i < 5; i++) {
        content += new Array(currentConfig.headers.length).fill('').join(',') + '\n';
      }

      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `template_${entityType}_import.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setGeneratedTemplate('CSV');
    } catch (error) {
      console.error('Error generating CSV template:', error);
      alert('حدث خطأ في إنشاء قالب CSV');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setShowReview(true);
      console.log('File selected for review:', file.name, file.type, file.size);
    }
  };

  const processImport = () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    // Here we would implement the actual import logic
    // For now, just simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      alert('تم معالجة الملف بنجاح! (هذه نسخة تجريبية)');
    }, 2000);
  };

  const handleReviewClose = () => {
    setShowReview(false);
    setUploadedFile(null);
    setImportResults(null);
  };

  const handleImportComplete = async (results: ImportResults) => {
    setImportResults(results);
    setShowReview(false);
    setIsProcessing(true);

    try {
      console.log('🚀 Starting Firebase import for', entityType, ':', results);

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // For company ID generation, fetch fresh data to avoid duplicates
      if (entityType === 'companies') {
        // Get fresh company list from Firebase before import
        const { getDocs, collection, query, orderBy } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase/config');
        
        const companiesRef = collection(db, 'companies');
        const q = query(companiesRef, orderBy('companyId', 'desc'));
        const snapshot = await getDocs(q);
        const existingCompanies = snapshot.docs.map(doc => ({ 
          ...doc.data(), 
          id: doc.id 
        })) as Array<{ id: string; companyId?: string; [key: string]: any }>;
        
        console.log('📊 Found existing companies for ID generation:', existingCompanies.length);

        // Import companies with proper sequential IDs
        for (let i = 0; i < results.importedData.length; i++) {
          const importedItem = results.importedData[i];
          try {
            console.log(`💾 Saving company ${i + 1}/${results.importedData.length} to Firebase:`, importedItem);
            
            // Calculate next ID manually to avoid conflicts
            const maxId = existingCompanies.length > 0 
              ? Math.max(...existingCompanies.map(c => parseInt(c.companyId || '0', 10))) 
              : 0;
            const nextId = (maxId + i + 1).toString().padStart(4, '0');
            
            // Map import data to Company format
            const companyData = {
              companyName: importedItem.companyName || '',
              email: importedItem.email || '',
              phone: importedItem.phone || '',
              address: importedItem.address || '',
              city: importedItem.city || '',
              contactPerson: importedItem.contactPerson || '',
              notes: importedItem.notes || '',
              // Set default values
              isActive: true,
              totalContracts: 0,
              totalBranches: 0,
              lastActivityDate: new Date().toISOString().split('T')[0]
            };

            const result = await addCompany(companyData, nextId); // Use manual ID
            if (result.success) {
              console.log('✅ Company saved successfully with ID:', nextId);
              successCount++;
            } else {
              const errorMsg = result.warnings?.join(', ') || 'فشل في حفظ الشركة';
              console.error('❌ Failed to save company:', errorMsg);
              errors.push(`شركة "${companyData.companyName}": ${errorMsg}`);
              errorCount++;
            }

          } catch (error) {
            console.error('❌ Error saving company to Firebase:', error);
            errors.push(`خطأ في حفظ الشركة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
            errorCount++;
          }
        }
        
      } else if (entityType === 'contracts') {
        console.log('💾 Saving contracts to Firebase...');
        
        for (const importedItem of results.importedData) {
          try {
            // Convert imported service flags to serviceBatches structure
            const serviceBatches = [{
              batchId: `import-batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              branchIds: [], // Empty for now - will be assigned when branches are linked
              services: {
                fireExtinguisherMaintenance: ['نعم', 'yes', 'true', '1'].includes(importedItem.fireExtinguisherMaintenance?.toLowerCase() || ''),
                alarmSystemMaintenance: ['نعم', 'yes', 'true', '1'].includes(importedItem.alarmSystemMaintenance?.toLowerCase() || ''),
                fireSuppressionMaintenance: ['نعم', 'yes', 'true', '1'].includes(importedItem.fireSuppressionMaintenance?.toLowerCase() || ''),
                gasFireSuppression: ['نعم', 'yes', 'true', '1'].includes(importedItem.gasFireSuppression?.toLowerCase() || ''),
                foamFireSuppression: ['نعم', 'yes', 'true', '1'].includes(importedItem.foamFireSuppression?.toLowerCase() || ''),
              },
              regularVisitsPerYear: parseInt(importedItem.regularVisitsPerYear || '0', 10),
              emergencyVisitsPerYear: parseInt(importedItem.emergencyVisitsPerYear || '0', 10),
              emergencyVisitCost: parseFloat(importedItem.emergencyVisitCost || '0'),
              notes: 'خدمات مستوردة من ملف CSV',
            }];

            // Map import data to new Contract format with serviceBatches
            const contractData = {
              companyId: importedItem.companyId || '',
              contractStartDate: importedItem.contractStartDate || '',
              contractEndDate: importedItem.contractEndDate || '',
              contractPeriodMonths: 12, // Default value since not in CSV
              contractValue: parseFloat(importedItem.contractValue || '0'),
              serviceBatches,
              notes: importedItem.notes || ''
            };

            const result = await addContract(contractData);
            if (result.success) {
              console.log('✅ Contract saved successfully:', result.contract?.contractId);
              successCount++;
            } else {
              const errorMsg = result.warnings?.join(', ') || 'فشل في حفظ العقد';
              console.error('❌ Failed to save contract:', errorMsg);
              errors.push(`عقد الشركة "${contractData.companyId}": ${errorMsg}`);
              errorCount++;
            }

          } catch (error) {
            console.error('❌ Error saving contract to Firebase:', error);
            errors.push(`خطأ في حفظ العقد: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
            errorCount++;
          }
        }

      } else if (entityType === 'contractsAdvanced') {
        console.log('💾 Saving contractsAdvanced to Firebase...');
        
        for (const importedItem of results.importedData) {
          try {
            // Convert imported service flags to serviceBatches structure
            const serviceBatches = [{
              batchId: `import-batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              branchIds: importedItem.branchIds ? importedItem.branchIds.split(',').map(id => id.trim()) : [],
              services: {
                fireExtinguisherMaintenance: ['نعم', 'yes', 'true', '1'].includes(importedItem.fireExtinguisherMaintenance?.toLowerCase() || ''),
                alarmSystemMaintenance: ['نعم', 'yes', 'true', '1'].includes(importedItem.alarmSystemMaintenance?.toLowerCase() || ''),
                fireSuppressionMaintenance: ['نعم', 'yes', 'true', '1'].includes(importedItem.fireSuppressionMaintenance?.toLowerCase() || ''),
                gasFireSuppression: ['نعم', 'yes', 'true', '1'].includes(importedItem.gasFireSuppression?.toLowerCase() || ''),
                foamFireSuppression: ['نعم', 'yes', 'true', '1'].includes(importedItem.foamFireSuppression?.toLowerCase() || ''),
              },
              regularVisitsPerYear: parseInt(importedItem.regularVisitsPerYear || '0', 10),
              emergencyVisitsPerYear: parseInt(importedItem.emergencyVisitsPerYear || '0', 10),
              emergencyVisitCost: parseFloat(importedItem.emergencyVisitCost || '0'),
              notes: importedItem.batchNotes || '',
            }];

            // Map import data to new Contract format with serviceBatches
            const contractData = {
              companyId: importedItem.companyId || '',
              contractStartDate: importedItem.contractStartDate || '',
              contractEndDate: importedItem.contractEndDate || '',
              contractPeriodMonths: parseInt(importedItem.contractPeriodMonths || '0', 10),
              contractValue: parseFloat(importedItem.contractValue || '0'),
              serviceBatches,
              notes: importedItem.contractNotes || ''
            };

            const result = await addContract(contractData);
            if (result.success) {
              console.log('✅ ContractAdvanced saved successfully:', result.contract?.contractId);
              successCount++;
            } else {
              const errorMsg = result.warnings?.join(', ') || 'فشل في حفظ العقد المتقدم';
              console.error('❌ Failed to save contractAdvanced:', errorMsg);
              errors.push(`عقد متقدم الشركة "${contractData.companyId}": ${errorMsg}`);
              errorCount++;
            }

          } catch (error) {
            console.error('❌ Error saving contractAdvanced to Firebase:', error);
            errors.push(`خطأ في حفظ العقد المتقدم: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
            errorCount++;
          }
        }

      } else if (entityType === 'branches') {
        console.log('💾 Saving branches to Firebase...');
        
        for (const importedItem of results.importedData) {
          try {
            // Determine company ID from either companyId or companyName
            let companyId = importedItem.companyId;
            
            if (!companyId && importedItem.companyName) {
              // Find company by name
              const company = existingCompanies.find(c => 
                c.companyName.toLowerCase() === importedItem.companyName.toLowerCase()
              );
              if (company) {
                companyId = company.companyId;
              }
            }
            
            if (!companyId) {
              const errorMsg = 'لم يتم العثور على الشركة';
              console.error('❌ Failed to find company for branch:', errorMsg);
              errors.push(`فرع "${importedItem.branchName}": ${errorMsg}`);
              errorCount++;
              continue;
            }
            
            // Map import data to Branch format
            const branchData = {
              companyId: companyId,
              city: importedItem.city || '',
              location: importedItem.location || '',
              branchName: importedItem.branchName || '',
              address: importedItem.address || '',
              contactPerson: importedItem.contactPerson || '',
              contactPhone: importedItem.contactPhone || '',
              teamMember: importedItem.teamMember || '',
              notes: importedItem.notes || ''
            };

            const result = await addBranch(branchData);
            if (result.success) {
              console.log('✅ Branch saved successfully:', result.branch?.branchId);
              successCount++;
            } else {
              const errorMsg = result.warnings?.join(', ') || 'فشل في حفظ الفرع';
              console.error('❌ Failed to save branch:', errorMsg);
              errors.push(`فرع "${branchData.branchName}": ${errorMsg}`);
              errorCount++;
            }

          } catch (error) {
            console.error('❌ Error saving branch to Firebase:', error);
            errors.push(`خطأ في حفظ الفرع: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
            errorCount++;
          }
        }
      }

      // Show results
      console.log('📊 Import Results:', { successCount, errorCount, errors });

      if (successCount > 0 && errorCount === 0) {
        // Complete success
        alert(`✅ تم الاستيراد بنجاح!\n\nتم حفظ ${successCount} عنصر في قاعدة البيانات.\n\nنوع البيانات: ${entityType === 'companies' ? 'شركات' : entityType === 'contracts' ? 'عقود' : 'فروع'}`);
      } else if (successCount > 0 && errorCount > 0) {
        // Partial success
        const errorList = errors.slice(0, 3).join('\n'); // Show first 3 errors
        alert(`⚠️ تم الاستيراد جزئياً!\n\nنجح: ${successCount}\nفشل: ${errorCount}\n\nأمثلة على الأخطاء:\n${errorList}`);
      } else {
        // Complete failure
        const errorList = errors.slice(0, 5).join('\n'); // Show first 5 errors
        alert(`❌ فشل الاستيراد!\n\nلم يتم حفظ أي عنصر.\n\nالأخطاء:\n${errorList}`);
      }

    } catch (error) {
      console.error('❌ Critical error during import:', error);
      alert(`❌ خطأ خطير أثناء الاستيراد: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Show review modal if file is uploaded
  if (showReview && uploadedFile) {
    return (
      <ImportReview
        file={uploadedFile}
        entityType={entityType}
        onClose={handleReviewClose}
        onImportComplete={handleImportComplete}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-right flex items-center justify-between">
            <span>{currentConfig.title}</span>
            {onClose && (
              <Button variant="ghost" onClick={onClose} className="p-2">
                ✕
              </Button>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Description */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-right">
              {currentConfig.description}
            </AlertDescription>
          </Alert>

          {/* Import Process Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1: Download Template */}
            <div className="text-center space-y-4 border rounded-lg p-6 bg-blue-50">
              <div className="bg-blue-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                <span className="text-white font-bold">1</span>
              </div>
              <h3 className="font-medium text-lg">تحميل القالب</h3>
              <Button
                onClick={generateCSVTemplate}
                disabled={isGenerating}
                className="gap-2 w-full"
                variant="outline"
              >
                <Download className="w-4 h-4" />
                {isGenerating ? 'جاري التحميل...' : 'تحميل قالب CSV'}
              </Button>
              <p className="text-sm text-gray-600">
                احفظ القالب وامملأه بالبيانات<br/>
                يمكن حفظه كـ CSV أو Excel
              </p>
            </div>

            {/* Step 2: Upload File */}
            <div className="text-center space-y-4 border rounded-lg p-6 bg-green-50">
              <div className="bg-green-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                <span className="text-white font-bold">2</span>
              </div>
              <h3 className="font-medium text-lg">رفع الملف المملوء</h3>
              <div className="space-y-3">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="import-file-input"
                />
                <Button
                  onClick={() => document.getElementById('import-file-input')?.click()}
                  className="gap-2 w-full"
                  disabled={isProcessing}
                  variant="outline"
                >
                  <Upload className="w-4 h-4" />
                  اختيار ملف للاستيراد
                </Button>
                <p className="text-sm text-gray-600">
                  يقبل ملفات CSV و Excel<br/>
                  (.csv, .xlsx, .xls)
                </p>
              </div>

              {uploadedFile && !showReview && (
                <div className="text-sm text-green-700 bg-white p-3 rounded border">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>تم اختيار الملف - سيتم فتح صفحة المراجعة...</span>
                  </div>
                </div>
              )}

              {importResults && (
                <div className="space-y-3">
                  <div className="text-sm text-green-700 bg-green-50 p-3 rounded border border-green-200">
                    <div className="font-medium mb-2">نتائج الاستيراد الأخيرة:</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>إجمالي السجلات: {importResults.totalRows}</div>
                      <div>تم استيراد: {importResults.successfulRows}</div>
                      <div>أخطاء: {importResults.errorRows}</div>
                      <div>تحذيرات: {importResults.warningRows}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Field Structure Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-right">هيكل البيانات المطلوبة:</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentConfig.headerLabels.map((label, index) => (
                <div key={index} className="border rounded p-3 bg-gray-50">
                  <div className="font-medium text-right text-blue-800">{label}</div>
                  <div className="text-sm text-gray-600 text-right mt-1">
                    مثال: {currentConfig.sampleData[index]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Validation Rules */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-right">قواعد التحقق والتحقق من صحة البيانات:</h3>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <ul className="space-y-2 text-right">
                {currentConfig.validationRules.map((rule, index) => (
                  <li key={index} className="text-sm text-yellow-800">
                    • {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Success Message */}
          {generatedTemplate && (
            <Alert className="border-green-500 bg-green-50">
              <Download className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 text-right">
                تم إنشاء وتحميل القالب بنجاح! يمكنك الآن ملء البيانات ورفع الملف للاستيراد.
              </AlertDescription>
            </Alert>
          )}

          {/* Important Notes */}
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h4 className="font-medium text-blue-800 text-right mb-2">ملاحظات مهمة:</h4>
            <ul className="space-y-1 text-sm text-blue-700 text-right">
              <li>• احفظ الملف بترميز UTF-8 للدعم الصحيح للنص العربي</li>
              <li>• استخدم التنسيق dd-mmm-yyyy للتواريخ (مثال: 15-Jan-2024)</li>
              <li>• الحقول المحددة بعلامة * مطلوبة</li>
              <li>• تأكد من صحة معرفات الشركات والعقود الموجودة</li>
              <li>• يمكن استخدام "نعم" أو "لا" لحقول الخدمات</li>
              <li>• يمكن حفظ القالب المملوء كـ CSV أو Excel - كلاهما مقبول</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                إغلاق
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
