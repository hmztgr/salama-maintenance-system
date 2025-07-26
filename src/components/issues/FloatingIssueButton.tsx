import React from 'react';
import { GlobalIssueButton } from './GlobalIssueButton';
import { Bug } from 'lucide-react';

export function FloatingIssueButton() {
  return (
    <div className="fixed bottom-6 left-6 z-50 md:hidden">
      <GlobalIssueButton
        variant="default"
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg"
        showBadge={true}
      />
    </div>
  );
} 