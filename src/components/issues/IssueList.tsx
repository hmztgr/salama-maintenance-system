import React, { useState, useMemo } from 'react';
import { useIssues } from '@/hooks/useIssues';
import { Issue, IssueCategory, IssuePriority, IssueStatus } from '@/types/issues';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ARABIC_LABELS, STATUS_LABELS, PRIORITY_COLORS, CATEGORY_ICONS } from '@/lib/constants/issues';
import { Search, Filter, Plus, Calendar, User, Tag } from 'lucide-react';

interface IssueListProps {
  onIssueClick?: (issue: Issue) => void;
  onCreateNew?: () => void;
}

export function IssueList({ onIssueClick, onCreateNew }: IssueListProps) {
  const { issues, loading, error } = useIssues();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<IssueCategory | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<IssuePriority | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'all'>('all');

  // Filter issues based on search and filters
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      // Search term filter
      const matchesSearch = searchTerm === '' || 
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      // Category filter
      const matchesCategory = categoryFilter === 'all' || issue.category === categoryFilter;

      // Priority filter
      const matchesPriority = priorityFilter === 'all' || issue.priority === priorityFilter;

      // Status filter
      const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;

      return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
    });
  }, [issues, searchTerm, categoryFilter, priorityFilter, statusFilter]);

  // Get issue statistics
  const stats = useMemo(() => {
    const total = issues.length;
    const open = issues.filter(i => i.status === 'open').length;
    const inProgress = issues.filter(i => i.status === 'in-progress').length;
    const resolved = issues.filter(i => i.status === 'resolved').length;
    const closed = issues.filter(i => i.status === 'closed').length;

    return { total, open, inProgress, resolved, closed };
  }, [issues]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل المشاكل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center text-red-600">
          <p>خطأ في تحميل المشاكل: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">المشاكل المبلغ عنها</h1>
        {onCreateNew && (
          <Button onClick={onCreateNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            إبلاغ عن مشكلة جديدة
          </Button>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">إجمالي المشاكل</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.open}</div>
            <div className="text-sm text-gray-600">مفتوحة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
            <div className="text-sm text-gray-600">قيد المعالجة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-sm text-gray-600">تم الحل</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
            <div className="text-sm text-gray-600">مغلقة</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            تصفية وبحث
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="البحث في المشاكل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={(value: IssueCategory | 'all') => setCategoryFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="نوع المشكلة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {Object.entries(ARABIC_LABELS.categories).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <span>{CATEGORY_ICONS[key as IssueCategory]}</span>
                      <span>{label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={(value: IssuePriority | 'all') => setPriorityFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="الأولوية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأولويات</SelectItem>
                {Object.entries(ARABIC_LABELS.priorities).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value: IssueStatus | 'all') => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      <div className="space-y-4">
        {filteredIssues.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600">لا توجد مشاكل تطابق المعايير المحددة</p>
            </CardContent>
          </Card>
        ) : (
          filteredIssues.map((issue) => (
            <Card 
              key={issue.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onIssueClick?.(issue)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{issue.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {issue.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={PRIORITY_COLORS[issue.priority]}>
                      {ARABIC_LABELS.priorities[issue.priority]}
                    </Badge>
                    <Badge variant="outline">
                      {STATUS_LABELS[issue.status]}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span>{CATEGORY_ICONS[issue.category]}</span>
                      <span>{ARABIC_LABELS.categories[issue.category]}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{issue.reportedByName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(issue.createdAt)}</span>
                    </div>
                  </div>

                  {issue.tags.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      <span>{issue.tags.length} علامات</span>
                    </div>
                  )}
                </div>

                {issue.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {issue.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {issue.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{issue.tags.length - 3} أكثر
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 