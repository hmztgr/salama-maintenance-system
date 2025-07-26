import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { IssueForm } from './IssueForm';
import { useIssues } from '@/hooks/useIssues';
import { Bug, X } from 'lucide-react';

interface GlobalIssueButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showBadge?: boolean;
}

export function GlobalIssueButton({ 
  variant = 'outline', 
  size = 'sm', 
  className = '',
  showBadge = true 
}: GlobalIssueButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [errorCount, setErrorCount] = useState(0);
  const { issues } = useIssues();

  // Capture console logs
  useEffect(() => {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleLog = console.log;

    const logs: string[] = [];
    let errors = 0;

    // Override console methods to capture logs
    console.error = (...args) => {
      errors++;
      const logEntry = `[ERROR] ${new Date().toISOString()}: ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ')}`;
      logs.push(logEntry);
      setConsoleLogs(prev => [...prev.slice(-50), logEntry]); // Keep last 50 logs
      setErrorCount(errors);
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args) => {
      const logEntry = `[WARN] ${new Date().toISOString()}: ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ')}`;
      logs.push(logEntry);
      setConsoleLogs(prev => [...prev.slice(-50), logEntry]);
      originalConsoleWarn.apply(console, args);
    };

    console.log = (...args) => {
      const logEntry = `[LOG] ${new Date().toISOString()}: ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ')}`;
      logs.push(logEntry);
      setConsoleLogs(prev => [...prev.slice(-50), logEntry]);
      originalConsoleLog.apply(console, args);
    };

    // Cleanup function
    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.log = originalConsoleLog;
    };
  }, []);

  // Get recent console logs for issue submission
  const getRecentLogs = () => {
    const recentLogs = consoleLogs.slice(-20); // Last 20 logs
    return recentLogs.join('\n');
  };

  // Handle form success
  const handleFormSuccess = (issueId: string) => {
    setIsOpen(false);
    // Clear logs after successful submission
    setConsoleLogs([]);
    setErrorCount(0);
  };

  // Get unread issues count
  const unreadIssues = issues.filter(issue => issue.status === 'open').length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="relative">
          <Button 
            variant={variant} 
            size={size} 
            className={`flex items-center gap-2 ${className}`}
          >
            <Bug className="h-4 w-4" />
            إبلاغ عن مشكلة
            {showBadge && errorCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                {errorCount}
              </Badge>
            )}
          </Button>
          {showBadge && unreadIssues > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs"
            >
              {unreadIssues}
            </Badge>
          )}
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>إبلاغ عن مشكلة جديدة</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Console Logs Preview */}
          {consoleLogs.length > 0 && (
            <div className="bg-gray-50 border rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <span>سجلات وحدة التحكم الأخيرة</span>
                {errorCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {errorCount} أخطاء
                  </Badge>
                )}
              </h4>
              <div className="bg-black text-green-400 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto">
                <pre>{getRecentLogs()}</pre>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                سيتم تضمين هذه السجلات تلقائياً في المشكلة المبلغ عنها
              </p>
            </div>
          )}

          {/* Issue Form */}
          <IssueForm 
            onSuccess={handleFormSuccess}
            onCancel={() => setIsOpen(false)}
            initialData={{
              description: consoleLogs.length > 0 
                ? `**المشكلة**: [وصف المشكلة]\n\n**سجلات وحدة التحكم**:\n\`\`\`\n${getRecentLogs()}\n\`\`\`\n\n**معلومات إضافية**: [أي معلومات ذات صلة]`
                : undefined
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 