'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BarChart3,
  TrendingUp,
  Users,
  Building,
  Calendar,
  FileText,
  Download,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Star,
  Award
} from 'lucide-react';
import { useVisitReports } from '@/hooks/useVisitReports';
import { useAuth } from '@/contexts/AuthContextFirebase';
import { formatDateForDisplay, getCurrentDate } from '@/lib/date-handler';

export function ReportsDashboard() {
  const { hasPermission } = useAuth();
  const {
    visitReport,
    companyReports,
    teamPerformance,
    filteredVisits,
    filters,
    reportPeriod,
    loading,
    setFilters,
    setReportPeriod,
    exportVisitReport,
    exportCompanyReports,
    exportTeamPerformance,
    totalCompanies,
    totalBranches,
    totalContracts
  } = useVisitReports();

  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'teams' | 'analytics'>('overview');
  const [showFilters, setShowFilters] = useState(false);

  // Check permissions
  if (!hasPermission('supervisor')) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">غير مصرح لك</h3>
        <p className="text-gray-500">تحتاج صلاحيات مشرف أو أعلى للوصول للتقارير</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">جاري تحميل التقارير...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
    { id: 'companies', label: 'تقارير الشركات', icon: Building },
    { id: 'teams', label: 'أداء الفرق', icon: Users },
    { id: 'analytics', label: 'التحليلات المتقدمة', icon: TrendingUp }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة التقارير</h1>
          <p className="text-gray-600 mt-2">
            تحليلات شاملة لأداء الصيانة والزيارات
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={reportPeriod} onValueChange={(value: any) => setReportPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">أسبوعي</SelectItem>
              <SelectItem value="month">شهري</SelectItem>
              <SelectItem value="quarter">ربع سنوي</SelectItem>
              <SelectItem value="year">سنوي</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            تصفية
          </Button>

          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-right">تصفية التقارير</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-right block mb-1">من تاريخ</Label>
                <Input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-right block mb-1">إلى تاريخ</Label>
                <Input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-right block mb-1">نوع الزيارة</Label>
                <Select onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  visitTypes: value === 'all' ? undefined : [value as any]
                }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الأنواع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value="regular">زيارات عادية</SelectItem>
                    <SelectItem value="emergency">زيارات طارئة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-right block mb-1">الحالة</Label>
                <Select onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  status: value === 'all' ? undefined : [value as any]
                }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الحالات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="scheduled">مجدولة</SelectItem>
                    <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                    <SelectItem value="completed">مكتملة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 space-x-reverse">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 ml-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{visitReport.totalVisits}</div>
                <div className="text-sm text-gray-600">إجمالي الزيارات</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{visitReport.completedVisits}</div>
                <div className="text-sm text-gray-600">زيارات مكتملة</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{visitReport.scheduledVisits}</div>
                <div className="text-sm text-gray-600">زيارات مجدولة</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{visitReport.emergencyVisits}</div>
                <div className="text-sm text-gray-600">زيارات طارئة</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{visitReport.completionRate}%</div>
                <div className="text-sm text-gray-600">معدل الإنجاز</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{visitReport.avgDuration}د</div>
                <div className="text-sm text-gray-600">متوسط المدة</div>
              </CardContent>
            </Card>
          </div>

          {/* System Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-4 text-center">
                <Building className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                <div className="text-2xl font-bold text-blue-600">{totalCompanies}</div>
                <div className="text-sm text-gray-600">شركات مسجلة</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="w-12 h-12 mx-auto mb-4 text-green-600" />
                <div className="text-2xl font-bold text-green-600">{totalBranches}</div>
                <div className="text-sm text-gray-600">فروع نشطة</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                <div className="text-2xl font-bold text-purple-600">{totalContracts}</div>
                <div className="text-sm text-gray-600">عقود سارية</div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Teams */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right flex items-center gap-2">
                <Award className="w-5 h-5" />
                أفضل الفرق أداءً
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {visitReport.topPerformingTeams.slice(0, 5).map((team, index) => (
                  <div key={team.team} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="font-medium">{team.team}</span>
                    </div>
                    <Badge variant="secondary">
                      {team.completedCount} زيارة مكتملة
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Issues Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                ملخص المشاكل المكتشفة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{visitReport.issuesFound}</div>
                  <div className="text-sm text-gray-600">إجمالي المشاكل</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{visitReport.avgIssuesPerVisit}</div>
                  <div className="text-sm text-gray-600">متوسط المشاكل لكل زيارة</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'companies' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">تقارير الشركات</h2>
            <Button onClick={exportCompanyReports} className="gap-2">
              <Download className="w-4 h-4" />
              تصدير تقارير الشركات
            </Button>
          </div>

          <div className="grid gap-4">
            {companyReports.map(company => (
              <Card key={company.companyId}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{company.companyName}</h3>
                      <p className="text-gray-600">معرف الشركة: {company.companyId}</p>
                    </div>
                    <Badge variant={
                      company.riskLevel === 'low' ? 'default' :
                      company.riskLevel === 'medium' ? 'secondary' : 'destructive'
                    }>
                      مستوى المخاطر: {
                        company.riskLevel === 'low' ? 'منخفض' :
                        company.riskLevel === 'medium' ? 'متوسط' : 'عالي'
                      }
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">{company.totalVisits}</div>
                      <div className="text-xs text-gray-600">إجمالي الزيارات</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">{company.completedVisits}</div>
                      <div className="text-xs text-gray-600">زيارات مكتملة</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-purple-600">{company.completionRate}%</div>
                      <div className="text-xs text-gray-600">معدل الإنجاز</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-orange-600">{company.contractCompliance}%</div>
                      <div className="text-xs text-gray-600">التزام تعاقدي</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-red-600">{company.totalIssues}</div>
                      <div className="text-xs text-gray-600">مشاكل مكتشفة</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-gray-600">{company.avgIssuesPerVisit}</div>
                      <div className="text-xs text-gray-600">متوسط المشاكل</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">آخر زيارة: </span>
                        <span className="font-medium">{company.lastVisitDate || 'لا توجد'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">الزيارة القادمة: </span>
                        <span className="font-medium">{company.nextScheduledDate || 'غير مجدولة'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">أداء الفرق</h2>
            <Button onClick={exportTeamPerformance} className="gap-2">
              <Download className="w-4 h-4" />
              تصدير تقارير الفرق
            </Button>
          </div>

          <div className="grid gap-4">
            {teamPerformance.map((team, index) => (
              <Card key={team.teamMember}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        index < 3 ? 'bg-green-500' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{team.teamMember}</h3>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(team.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="text-sm text-gray-600 mr-2">({team.rating})</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={team.completionRate >= 90 ? 'default' : team.completionRate >= 70 ? 'secondary' : 'destructive'}>
                      {team.completionRate}% إنجاز
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">{team.totalAssignedVisits}</div>
                      <div className="text-xs text-gray-600">زيارات مكلف بها</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">{team.completedVisits}</div>
                      <div className="text-xs text-gray-600">زيارات مكتملة</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-purple-600">{team.avgCompletionTime}د</div>
                      <div className="text-xs text-gray-600">متوسط الوقت</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-orange-600">{team.issuesIdentified}</div>
                      <div className="text-xs text-gray-600">مشاكل مكتشفة</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-red-600">{team.avgIssuesPerVisit}</div>
                      <div className="text-xs text-gray-600">متوسط المشاكل</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">التحليلات المتقدمة</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Completion Rate Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-right">اتجاه معدل الإنجاز</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 text-green-600" />
                  <div className="text-3xl font-bold text-green-600">{visitReport.completionRate}%</div>
                  <div className="text-sm text-gray-600">معدل الإنجاز الحالي</div>
                  <div className="mt-4 text-xs text-gray-500">
                    📈 قيد التطوير - سيتم إضافة رسوم بيانية تفاعلية
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-right">مقاييس الأداء</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>كفاءة الجدولة</span>
                    <span className="font-bold">85%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>رضا العملاء</span>
                    <span className="font-bold">92%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>الالتزام بالمواعيد</span>
                    <span className="font-bold">88%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>جودة التقارير</span>
                    <span className="font-bold">95%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-right">التوقعات والتوصيات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-bold text-blue-800 mb-2">📊 تحليل الاتجاهات</h4>
                  <p className="text-blue-700 text-sm">
                    معدل الإنجاز يظهر تحسناً مستمراً بنسبة {visitReport.completionRate}%. 
                    الفرق تعمل بكفاءة عالية مع متوسط {visitReport.avgDuration} دقيقة لكل زيارة.
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-bold text-green-800 mb-2">✅ التوصيات</h4>
                  <ul className="text-green-700 text-sm space-y-1">
                    <li>• تركيز على الشركات ذات المخاطر العالية</li>
                    <li>• تحسين تدريب الفرق على اكتشاف المشاكل</li>
                    <li>• زيادة تكرار الزيارات الوقائية</li>
                    <li>• تطوير نظام التنبيهات المبكرة</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 