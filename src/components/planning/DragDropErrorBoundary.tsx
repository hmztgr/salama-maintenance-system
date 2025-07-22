import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class DragDropErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Drag and drop error:', error, errorInfo);
    
    // Log to error reporting service
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="drag-drop-error">
          <div className="error-content">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              حدث خطأ في واجهة السحب والإفلات
            </h3>
            <p className="text-gray-600 mb-4">
              تم تفعيل الواجهة البديلة باستخدام الأزرار
            </p>
            <Button onClick={this.handleRetry}>
              إعادة المحاولة
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 