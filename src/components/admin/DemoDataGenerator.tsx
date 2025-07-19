'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCompanies } from '@/hooks/useCompanies';
import { useContracts } from '@/hooks/useContracts';
import { useBranches } from '@/hooks/useBranches';
import { useVisits } from '@/hooks/useVisits';
import { useAuth } from '@/contexts/AuthContextFirebase';
import { formatDateForDisplay } from '@/lib/date-handler';
import { Database, Trash2, RefreshCw } from 'lucide-react';
import { Branch } from '@/types/customer';

export function DemoDataGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [generatedStats, setGeneratedStats] = useState<{
    companies: number;
    contracts: number;
    branches: number;
    visits: number;
  } | null>(null);

  const { hasPermission } = useAuth();
  const { addCompany, companies, deleteCompany } = useCompanies();
  const { addContract, contracts, deleteContract } = useContracts();
  const { addBranch, branches, deleteBranch } = useBranches();
  const { addVisit, visits, deleteVisit } = useVisits();

  // Demo data templates
  const saudiCities = [
    'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'الظهران',
    'الطائف', 'بريدة', 'تبوك', 'خميس مشيط', 'حائل', 'نجران', 'الجبيل', 'ينبع',
    'أبها', 'عرعر', 'سكاكا', 'جيزان', 'القطيف', 'الأحساء', 'الباحة'
  ];

  const companyTypes = [
    'شركة', 'مؤسسة', 'مجموعة', 'شركة المحدودة', 'مجمع', 'مركز', 'مكتب'
  ];

  const businessSectors = [
    'التجارة العامة', 'الخدمات الطبية', 'التعليم', 'الضيافة والفنادق', 'الصناعة',
    'العقارات', 'الخدمات المالية', 'التكنولوجيا', 'النقل والمواصلات', 'البيع بالتجزئة',
    'الخدمات الحكومية', 'الطاقة', 'الاتصالات', 'الزراعة', 'البناء والمقاولات'
  ];

  const locationTypes = [
    'المركز الرئيسي', 'الفرع الشمالي', 'الفرع الجنوبي', 'الفرع الشرقي', 'الفرع الغربي',
    'مجمع تجاري', 'مكتب إداري', 'مستودع', 'معرض', 'مختبر', 'ورشة', 'مصنع'
  ];

  const teamMembers = [
    'أحمد محمد', 'سالم علي', 'فهد عبدالله', 'خالد سعد', 'محمد عبدالرحمن',
    'عبدالله أحمد', 'سعد محمد', 'علي سالم', 'عبدالرحمن فهد', 'نايف خالد'
  ];

  const generateRandomPhone = () => {
    const prefixes = ['050', '053', '054', '055', '056', '059'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    return prefix + number;
  };

  const generateRandomEmail = (companyName: string) => {
    const domains = ['gmail.com', 'hotmail.com', 'outlook.com', 'company.sa'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const cleanName = companyName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return `info@${cleanName.substring(0, 8)}.${domain}`;
  };

  const generateDateInRange = (startDate: Date, endDate: Date): string => {
    const start = startDate.getTime();
    const end = endDate.getTime();
    const randomTime = start + Math.random() * (end - start);
    const date = new Date(randomTime);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  const addMonthsToDate = (dateStr: string, months: number): string => {
    const [day, month, year] = dateStr.split('-');
    const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month);

    const date = new Date(parseInt(year), monthIndex, parseInt(day));
    date.setMonth(date.getMonth() + months);

    const months_arr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const newDay = date.getDate().toString().padStart(2, '0');
    const newMonth = months_arr[date.getMonth()];
    const newYear = date.getFullYear();

    return `${newDay}-${newMonth}-${newYear}`;
  };

  const generateDemoData = async () => {
    if (!hasPermission('admin')) {
      alert('يجب أن تكون مسؤول لإنشاء البيانات التجريبية');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress('بدء إنشاء البيانات التجريبية...');

    try {
      let companiesCount = 0;
      let contractsCount = 0;
      let branchesCount = 0;
      let visitsCount = 0;

      // Generate 30 companies
      setGenerationProgress('إنشاء الشركات...');
      const generatedCompanies = [];

      for (let i = 1; i <= 30; i++) {
        const sector = businessSectors[Math.floor(Math.random() * businessSectors.length)];
        const companyType = companyTypes[Math.floor(Math.random() * companyTypes.length)];
        const city = saudiCities[Math.floor(Math.random() * saudiCities.length)];

        const companyName = `${companyType} ${sector} ${city} ${i}`;

        const companyData = {
          companyName,
          email: generateRandomEmail(companyName),
          phone: generateRandomPhone(),
          address: `شارع ${i}، حي ${sector}، ${city}`,
          contactPerson: teamMembers[Math.floor(Math.random() * teamMembers.length)],
          notes: `شركة رائدة في مجال ${sector} تأسست عام ${2020 - Math.floor(Math.random() * 10)}`
        };

        console.log('🏢 Creating company:', companyName);

        // Generate unique ID manually to avoid ID collision
        const manualCompanyId = i.toString().padStart(4, '0'); // Use simple incremental ID
        const result = addCompany(companyData, manualCompanyId);
        console.log('🏢 Company creation result:', result);

        if (result.success && result.company) {
          generatedCompanies.push(result.company);
          companiesCount++;
          console.log('✅ Successfully created company:', result.company.companyName, 'Total so far:', companiesCount);
        } else {
          console.error('❌ Failed to create company:', companyName, 'Result:', result);
        }

        // Longer delay to ensure React state updates complete
        await new Promise(resolve => setTimeout(resolve, 100));

        // Force a refresh of companies state by calling refreshCompanies
        if (i % 5 === 0) {
          console.log('🔄 Refreshing companies state...');
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Generate contracts (90% single contract, 10% dual contracts)
      setGenerationProgress('إنشاء العقود...');
      const generatedContracts = [];

      console.log('🏢 Starting contract generation for', generatedCompanies.length, 'companies');

      for (const company of generatedCompanies) {
        console.log('📋 Creating contracts for company:', company.companyName, 'ID:', company.companyId);

        const hasMultipleContracts = Math.random() < 0.1; // 10% chance
        const contractsToCreate = hasMultipleContracts ? 2 : 1;

        console.log('📊 Will create', contractsToCreate, 'contracts for', company.companyName);

        for (let contractIndex = 0; contractIndex < contractsToCreate; contractIndex++) {
          const contractStartDate = generateDateInRange(
            new Date('2023-01-01'),
            new Date('2024-06-01')
          );
          const contractEndDate = addMonthsToDate(contractStartDate, 12 + Math.floor(Math.random() * 24));

          // Different service combinations for multiple contracts
          let services;
          if (hasMultipleContracts) {
            if (contractIndex === 0) {
              // First contract: basic services
              services = {
                fireExtinguisherMaintenance: true,
                alarmSystemMaintenance: true,
                fireSuppressionMaintenance: false,
                gasFireSuppression: false,
                foamFireSuppression: false
              };
            } else {
              // Second contract: advanced services
              services = {
                fireExtinguisherMaintenance: false,
                alarmSystemMaintenance: false,
                fireSuppressionMaintenance: true,
                gasFireSuppression: Math.random() > 0.5,
                foamFireSuppression: Math.random() > 0.5
              };
            }
          } else {
            // Single contract: random services
            services = {
              fireExtinguisherMaintenance: Math.random() > 0.2,
              alarmSystemMaintenance: Math.random() > 0.3,
              fireSuppressionMaintenance: Math.random() > 0.6,
              gasFireSuppression: Math.random() > 0.8,
              foamFireSuppression: Math.random() > 0.8
            };
          }

          // Create demo service batches for the new contract structure
          const serviceBatches = [];
          
          // For demo purposes, create 1-2 service batches per contract
          const numBatches = hasMultipleContracts ? (contractIndex === 0 ? 1 : 2) : Math.random() > 0.7 ? 2 : 1;
          
          for (let batchIndex = 0; batchIndex < numBatches; batchIndex++) {
            const batch = {
              batchId: `batch-${Date.now()}-${batchIndex}`,
              branchIds: [], // Will be populated when branches are created
              services: batchIndex === 0 ? {
                // First batch: basic services
                fireExtinguisherMaintenance: true,
                alarmSystemMaintenance: Math.random() > 0.3,
                fireSuppressionMaintenance: Math.random() > 0.7,
                gasFireSuppression: Math.random() > 0.8,
                foamFireSuppression: Math.random() > 0.9
              } : {
                // Second batch: advanced services
                fireExtinguisherMaintenance: false,
                alarmSystemMaintenance: false,
                fireSuppressionMaintenance: true,
                gasFireSuppression: Math.random() > 0.5,
                foamFireSuppression: Math.random() > 0.5
              },
              regularVisitsPerYear: [12, 6, 4, 3, 2][Math.floor(Math.random() * 5)],
              emergencyVisitsPerYear: Math.floor(Math.random() * 4) + 1,
              notes: batchIndex === 0 ? 'مجموعة الخدمات الأساسية' : 'مجموعة الخدمات المتقدمة'
            };
            serviceBatches.push(batch);
          }

          const contractData = {
            companyId: company.companyId,
            contractStartDate,
            contractEndDate,
            contractValue: (Math.floor(Math.random() * 100) + 20) * 1000,
            serviceBatches,
            notes: hasMultipleContracts
              ? `عقد ${contractIndex === 0 ? 'الخدمات الأساسية' : 'الخدمات المتقدمة'}`
              : 'عقد صيانة شامل'
          };

          console.log('🔄 Creating contract with data:', contractData);
          const contractResult = addContract(contractData);
          console.log('📋 Contract creation result:', contractResult);

          if (contractResult.success && contractResult.contract) {
            generatedContracts.push(contractResult.contract);
            contractsCount++;
            console.log('✅ Successfully created contract:', contractResult.contract.contractId);
          } else {
            console.error('❌ Failed to create contract for company:', company.companyName, 'Result:', contractResult);
          }
        }
      }

      // Generate 100 branches (3-4 per company on average)
      setGenerationProgress('إنشاء الفروع...');
      const generatedBranches = [];

      console.log('🏪 Starting branch generation. Generated contracts:', generatedContracts.length);

      for (const company of generatedCompanies) {
        const companyContracts = generatedContracts.filter(c => c.companyId === company.companyId);
        console.log('🏢 Company:', company.companyName, 'has', companyContracts.length, 'contracts');

        const branchesPerCompany = Math.floor(100 / 30) + (Math.random() > 0.5 ? 1 : 0); // 3-4 branches
        console.log('📊 Will create', branchesPerCompany, 'branches for', company.companyName);

        for (let branchIndex = 0; branchIndex < branchesPerCompany && branchesCount < 100; branchIndex++) {
          const city = saudiCities[Math.floor(Math.random() * saudiCities.length)];
          const location = locationTypes[Math.floor(Math.random() * locationTypes.length)];

          const branchData = {
            companyId: company.companyId,
            city,
            location,
            branchName: `${location} - ${city}`,
            address: `مبنى ${branchIndex + 1}، شارع ${Math.floor(Math.random() * 50) + 1}، ${city}`,
            contactPerson: teamMembers[Math.floor(Math.random() * teamMembers.length)],
            contactPhone: generateRandomPhone(),
            teamMember: teamMembers[Math.floor(Math.random() * teamMembers.length)],
            notes: `فرع تشغيلي في ${city} - ${location}`
          };

          const branchResult = addBranch(branchData);
          if (branchResult.success && branchResult.branch) {
            generatedBranches.push(branchResult.branch);
            branchesCount++;
          } else {
            console.warn('Failed to create branch:', branchResult.warnings);
          }

          // Small delay to prevent overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      // Generate visits based on contracts
      // TEMPORARILY DISABLED: Visit generation needs update for new serviceBatches structure
      setGenerationProgress('تخطي إنشاء الزيارات مؤقتاً...');
      console.log('⚠️ Visit generation temporarily disabled during restructure');
      /*
      const today = new Date();
      const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
      const oneYearFromNow = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);

      console.log('🗓️ Starting visit generation for', generatedBranches.length, 'branches');

      for (const branch of generatedBranches) {
        console.log('🏪 Creating visits for branch:', branch.branchName, 'ID:', branch.branchId);

        // Find contracts that include this branch in their service batches
        const relevantContracts = generatedContracts.filter(contract => 
          contract.companyId === branch.companyId &&
          contract.serviceBatches.some(batch => batch.branchIds.includes(branch.branchId))
        );

        for (const contract of relevantContracts) {
          // Find the service batch that includes this branch
          const serviceBatch = contract.serviceBatches.find(batch => 
            batch.branchIds.includes(branch.branchId)
          );
          
          if (!serviceBatch) continue;

          console.log('📋 Processing contract:', contract.contractId, 'visits per year:', serviceBatch.regularVisitsPerYear);

          // Fix date parsing for dd-mmm-yyyy format (e.g., "27-Jul-2023")
          const parseContractDate = (dateStr: string): Date => {
            const [day, month, year] = dateStr.split('-');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthIndex = monthNames.indexOf(month);
            return new Date(parseInt(year), monthIndex, parseInt(day));
          };

          const contractStart = parseContractDate(contract.contractStartDate);
          const contractEnd = parseContractDate(contract.contractEndDate);

          console.log('📅 Contract period:', contract.contractStartDate, 'to', contract.contractEndDate);
          console.log('📅 Parsed dates:', contractStart.toISOString(), 'to', contractEnd.toISOString());

          // Generate regular visits - distribute properly across contract period
          const visitInterval = Math.floor(365 / contract.regularVisitsPerYear);

          // Start from the beginning of the contract period or one year ago, whichever is later
          let currentDate = new Date(Math.max(contractStart.getTime(), oneYearAgo.getTime()));

          // If contract started recently, spread visits backwards to fill the year
          if (contractStart > oneYearAgo) {
            // Calculate how many visits should have happened by now
            const daysSinceStart = Math.floor((today.getTime() - contractStart.getTime()) / (24 * 60 * 60 * 1000));
            const visitsSinceStart = Math.floor(daysSinceStart / visitInterval);

            // Start from an earlier date to create proper distribution
            currentDate = new Date(contractStart.getTime() - (visitsSinceStart * visitInterval * 24 * 60 * 60 * 1000));
            currentDate = new Date(Math.max(currentDate.getTime(), oneYearAgo.getTime()));
          }

          let branchVisitCount = 0;
          while (currentDate < contractEnd && currentDate < oneYearFromNow && branchVisitCount < contract.regularVisitsPerYear * 2) {
            const visitDate = formatDateForDisplay(currentDate.toISOString());
            const isPastVisit = currentDate < today;

            let status: 'scheduled' | 'completed' = 'scheduled';
            let completedDate = undefined;
            let results = undefined;

            if (isPastVisit) {
              // 90% completed, 10% late
              const isCompleted = Math.random() > 0.1;
              status = isCompleted ? 'completed' : 'scheduled'; // late visits still show as scheduled

              if (isCompleted) {
                completedDate = visitDate;
                results = {
                  overallStatus: Math.random() > 0.15 ? 'passed' : (Math.random() > 0.5 ? 'partial' : 'failed') as 'passed' | 'failed' | 'partial',
                  issues: Math.random() > 0.7 ? ['طفاية منتهية الصلاحية', 'نظام إنذار بحاجة معايرة'] : [],
                  recommendations: Math.random() > 0.8 ? ['استبدال البطاريات', 'صيانة دورية إضافية'] : [],
                  nextVisitDate: addMonthsToDate(visitDate, Math.floor(365 / contract.regularVisitsPerYear / 30))
                };
              }
            }

            const visitData = {
              branchId: branch.branchId,
              contractId: contract.contractId,
              companyId: branch.companyId,
              type: 'regular' as const,
              status: status,
              scheduledDate: visitDate,
              scheduledTime: `${8 + Math.floor(Math.random() * 8)}:${Math.random() > 0.5 ? '00' : '30'}`,
              completedDate,
              assignedTeam: teamMembers[Math.floor(Math.random() * teamMembers.length)],
              assignedTechnician: teamMembers[Math.floor(Math.random() * teamMembers.length)],
              services: {
                fireExtinguisher: contract.fireExtinguisherMaintenance,
                alarmSystem: contract.alarmSystemMaintenance,
                fireSuppression: contract.fireSuppressionMaintenance,
                gasSystem: contract.gasFireSuppression,
                foamSystem: contract.foamFireSuppression
              },
              results,
              notes: isPastVisit && status === 'completed' ? 'زيارة صيانة دورية مكتملة' : 'زيارة صيانة دورية مجدولة',
              createdBy: 'مولد البيانات التجريبية'
            };

            console.log('📅 Creating visit for branch:', branch.branchName, 'on date:', visitDate);
            const visitResult = addVisit(visitData);
            console.log('📅 Visit creation result:', visitResult.success ? 'SUCCESS' : 'FAILED');

            if (visitResult.success) {
              visitsCount++;
              branchVisitCount++;
              console.log('✅ Successfully created visit. Total visits now:', visitsCount);
            } else {
              console.error('❌ Failed to create visit for branch:', branch.branchName, 'Result:', visitResult);
            }

            // Add small delay to prevent rapid state updates
            await new Promise(resolve => setTimeout(resolve, 5));

            // Increment date with some randomization for realistic distribution
            const baseInterval = visitInterval * 24 * 60 * 60 * 1000;
            const randomVariation = Math.floor(Math.random() * 14 - 7) * 24 * 60 * 60 * 1000; // ±7 days
            currentDate = new Date(currentDate.getTime() + baseInterval + randomVariation);
          }

          // Generate some emergency visits (past only) - limit to prevent performance issues
          const emergencyCount = Math.min(Math.floor(Math.random() * 2), 1); // 0-1 emergency visits max
          console.log('🚨 Creating', emergencyCount, 'emergency visits for branch:', branch.branchName);

          for (let i = 0; i < emergencyCount; i++) {
            const emergencyDate = new Date(oneYearAgo.getTime() + Math.random() * (today.getTime() - oneYearAgo.getTime()));
            const visitDate = formatDateForDisplay(emergencyDate.toISOString());

            const visitData = {
              branchId: branch.branchId,
              contractId: contract.contractId,
              companyId: branch.companyId,
              type: 'emergency' as const,
              status: 'completed' as const,
              scheduledDate: visitDate,
              completedDate: visitDate,
              scheduledTime: `${Math.floor(Math.random() * 24)}:${Math.random() > 0.5 ? '00' : '30'}`,
              assignedTeam: teamMembers[Math.floor(Math.random() * teamMembers.length)],
              assignedTechnician: teamMembers[Math.floor(Math.random() * teamMembers.length)],
              services: {
                fireExtinguisher: contract.fireExtinguisherMaintenance,
                alarmSystem: contract.alarmSystemMaintenance,
                fireSuppression: contract.fireSuppressionMaintenance,
                gasSystem: contract.gasFireSuppression,
                foamSystem: contract.foamFireSuppression
              },
              results: {
                overallStatus: Math.random() > 0.2 ? 'passed' : 'partial' as 'passed' | 'partial',
                issues: ['مشكلة طارئة تم حلها'],
                recommendations: ['متابعة دورية إضافية'],
                nextVisitDate: addMonthsToDate(visitDate, 1)
              },
              notes: 'زيارة طارئة - تم التعامل مع المشكلة فوراً',
              createdBy: 'مولد البيانات التجريبية'
            };

            console.log('🚨 Creating emergency visit for branch:', branch.branchName, 'on date:', visitDate);
            const visitResult = addVisit(visitData);
            console.log('🚨 Emergency visit creation result:', visitResult.success ? 'SUCCESS' : 'FAILED');

            if (visitResult.success) {
              visitsCount++;
              branchVisitCount++;
              console.log('✅ Successfully created emergency visit. Total visits now:', visitsCount);
            } else {
              console.error('❌ Failed to create emergency visit for branch:', branch.branchName, 'Result:', visitResult);
            }

            // Add small delay for emergency visits too
            await new Promise(resolve => setTimeout(resolve, 5));
          }

          console.log('📊 Completed visits for branch:', branch.branchName, 'Total branch visits:', branchVisitCount);
        }
      }

      console.log('📊 Final generation counts:', {
        companiesCount,
        contractsCount,
        branchesCount,
        visitsCount,
        generatedCompaniesLength: generatedCompanies.length,
        generatedContractsLength: generatedContracts.length,
        generatedBranchesLength: generatedBranches.length
      });

      setGeneratedStats({
        companies: companiesCount,
        contracts: contractsCount,
        branches: branchesCount,
        visits: visitsCount
      });

      setGenerationProgress('تم إنشاء البيانات التجريبية بنجاح!');

      */
      // End of temporarily disabled visit generation section
      
    } catch (error) {
      console.error('Error generating demo data:', error);
      setGenerationProgress('حدث خطأ أثناء إنشاء البيانات التجريبية');
    } finally {
      setIsGenerating(false);
    }
  };

  const clearAllData = () => {
    if (!hasPermission('admin')) {
      alert('يجب أن تكون مسؤول لحذف البيانات');
      return;
    }

    if (!confirm('هل أنت متأكد من حذف جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه!')) {
      return;
    }

    try {
      console.log('🗑️ Starting to clear all data...');
      console.log('📊 Current data counts:', {
        visits: visits.length,
        branches: branches.length,
        contracts: contracts.length,
        companies: companies.length
      });

      // Collect all IDs first to avoid race conditions
      const allVisitIds = visits.map(visit => visit.id);
      const allBranchIds = branches.map(branch => branch.id);
      const allContractIds = contracts.map(contract => contract.id);
      const allCompanyIds = companies.map(company => company.id);

      const deletedCounts = {
        visits: 0,
        branches: 0,
        contracts: 0,
        companies: 0
      };

      // Delete visits first
      console.log('🗑️ Deleting visits...');
      allVisitIds.forEach(visitId => {
        if (deleteVisit(visitId)) {
          deletedCounts.visits++;
        }
      });

      // Delete branches
      console.log('🗑️ Deleting branches...');
      allBranchIds.forEach(branchId => {
        if (deleteBranch(branchId)) {
          deletedCounts.branches++;
        }
      });

      // Delete contracts
      console.log('🗑️ Deleting contracts...');
      allContractIds.forEach(contractId => {
        if (deleteContract(contractId)) {
          deletedCounts.contracts++;
        }
      });

      // Delete companies
      console.log('🗑️ Deleting companies...');
      allCompanyIds.forEach(companyId => {
        if (deleteCompany(companyId)) {
          deletedCounts.companies++;
        }
      });

      console.log('✅ Deletion completed:', deletedCounts);

      setGeneratedStats(null);

      const successMessage = `تم حذف جميع البيانات بنجاح!\n\n` +
        `الزيارات المحذوفة: ${deletedCounts.visits}\n` +
        `الفروع المحذوفة: ${deletedCounts.branches}\n` +
        `العقود المحذوفة: ${deletedCounts.contracts}\n` +
        `الشركات المحذوفة: ${deletedCounts.companies}`;

      alert(successMessage);
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('حدث خطأ أثناء حذف البيانات');
    }
  };

  if (!hasPermission('admin')) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">هذه الأداة متاحة للمسؤولين فقط</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right flex items-center justify-between">
          <span>مولد البيانات التجريبية</span>
          <Database className="w-6 h-6" />
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <Alert>
          <Database className="h-4 w-4" />
          <AlertDescription className="text-right">
            هذه الأداة تنشئ بيانات تجريبية شاملة لاختبار نظام الاستيراد والتصدير
          </AlertDescription>
        </Alert>

        {/* Current Data Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center border rounded p-3">
            <div className="text-2xl font-bold text-blue-600">{companies.length}</div>
            <div className="text-sm text-gray-600">شركات</div>
          </div>
          <div className="text-center border rounded p-3">
            <div className="text-2xl font-bold text-green-600">{contracts.length}</div>
            <div className="text-sm text-gray-600">عقود</div>
          </div>
          <div className="text-center border rounded p-3">
            <div className="text-2xl font-bold text-purple-600">{branches.length}</div>
            <div className="text-sm text-gray-600">فروع</div>
          </div>
          <div className="text-center border rounded p-3">
            <div className="text-2xl font-bold text-orange-600">{visits.length}</div>
            <div className="text-sm text-gray-600">زيارات</div>
          </div>
        </div>

        {/* Generation Progress */}
        {isGenerating && (
          <Alert>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <AlertDescription className="text-right">
              {generationProgress}
            </AlertDescription>
          </Alert>
        )}

        {/* Generated Stats */}
        {generatedStats && (
          <Alert className="border-green-500 bg-green-50">
            <Database className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 text-right">
              <div className="font-medium mb-2">تم إنشاء البيانات التجريبية بنجاح:</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>{generatedStats.companies} شركة</div>
                <div>{generatedStats.contracts} عقد</div>
                <div>{generatedStats.branches} فرع</div>
                <div>{generatedStats.visits} زيارة</div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Demo Data Description */}
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h4 className="font-medium text-blue-800 text-right mb-2">البيانات التجريبية تشمل:</h4>
          <ul className="text-sm text-blue-700 text-right space-y-1">
            <li>• 30 شركة بمعلومات واقعية (أسماء، عناوين، هواتف)</li>
            <li>• ~33 عقد (90% شركة واحدة لكل عقد، 10% شركات بعقدين منفصلين)</li>
            <li>• 100 فرع موزعة على الشركات (3-4 فروع لكل شركة)</li>
            <li>• زيارات متنوعة: دورية حسب تكرار العقد، طارئة عشوائية</li>
            <li>• 90% من الزيارات السابقة مكتملة، 10% متأخرة</li>
            <li>• زيارات مستقبلية موزعة على مدار السنة</li>
            <li>• خدمات متنوعة: طفايات، إنذار، إطفاء، غاز، فوم</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Button
            onClick={clearAllData}
            variant="destructive"
            className="gap-2"
            disabled={isGenerating}
          >
            <Trash2 className="w-4 h-4" />
            حذف جميع البيانات
          </Button>
          <Button
            onClick={generateDemoData}
            disabled={isGenerating}
            className="gap-2"
          >
            <Database className="w-4 h-4" />
            {isGenerating ? 'جاري الإنشاء...' : 'إنشاء بيانات تجريبية'}
          </Button>
        </div>

        {/* Usage Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <h4 className="font-medium text-yellow-800 text-right mb-2">طريقة الاستخدام:</h4>
          <ol className="text-sm text-yellow-700 text-right space-y-1">
            <li>1. اضغط "إنشاء بيانات تجريبية" لإنشاء البيانات</li>
            <li>2. انتقل إلى تبويب "التخطيط" → "إدارة الزيارات"</li>
            <li>3. جرب استيراد وتصدير البيانات</li>
            <li>4. اختبر التحقق من صحة البيانات</li>
            <li>5. استخدم "حذف جميع البيانات" لمسح البيانات التجريبية</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
