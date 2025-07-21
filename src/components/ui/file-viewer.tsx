'use client';

import { useState, useEffect } from 'react';
import { X, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface FileViewerProps {
  file: {
    name: string;
    url: string;
    type: string;
    size?: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function FileViewer({ file, isOpen, onClose }: FileViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reset state when file changes
  useEffect(() => {
    if (isOpen && file) {
      console.log('📄 FileViewer - Opening file:', file);
      setIsLoading(true);
      setError(null);
    }
  }, [isOpen, file]);

  // Add error boundary
  const handleError = (error: Error) => {
    console.error('📄 FileViewer - Error:', error);
    setError('حدث خطأ في عرض الملف');
    setIsLoading(false);
  };

  if (!isOpen || !file) return null;

  const isImage = file.type.startsWith('image/');
  const isPDF = file.type === 'application/pdf';
  const isViewable = isImage || isPDF;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExternalView = () => {
    window.open(file.url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[95vw] h-[95vh] mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {file.name}
            </h3>
            {file.size && (
              <span className="text-sm text-gray-500">
                ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              تحميل
            </Button>
            {!isViewable && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExternalView}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                عرض خارجي
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isViewable ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              {isImage ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="max-w-full max-h-full object-contain"
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setIsLoading(false);
                    setError('فشل في تحميل الصورة');
                  }}
                />
                             ) : isPDF ? (
                 <iframe
                   src={`${file.url}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                   className="w-full h-full border-0"
                   onLoad={() => setIsLoading(false)}
                   onError={() => {
                    console.error('📄 FileViewer - PDF load error');
                     setIsLoading(false);
                     setError('فشل في تحميل ملف PDF');
                   }}
                   style={{ minHeight: '80vh' }}
                 />
              ) : null}
              
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">جاري التحميل...</p>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                  <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={handleExternalView} variant="outline">
                      فتح في نافذة جديدة
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-100">
              <div className="text-center">
                <div className="text-6xl text-gray-400 mb-4">📄</div>
                <p className="text-gray-600 mb-4">لا يمكن عرض هذا النوع من الملفات</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleDownload} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    تحميل
                  </Button>
                  <Button onClick={handleExternalView} variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    عرض خارجي
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 