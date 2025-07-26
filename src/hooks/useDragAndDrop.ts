import { useState, useEffect, useCallback } from 'react';
import { DragDropState } from '@/types/weekly-planning';

export function useDragAndDrop() {
  const [isDragSupported, setIsDragSupported] = useState(false);
  const [dragState, setDragState] = useState<DragDropState>({
    isDragging: false,
    draggedVisitId: null,
    dragSourceDay: null,
    dragTargetDay: null,
    isDragSupported: false
  });

  // Check if drag-and-drop is supported
  useEffect(() => {
    const testElement = document.createElement('div');
    testElement.draggable = true;
    
    const supported = 'draggable' in testElement && 
                     'ondragstart' in testElement &&
                     'ondrop' in testElement;
    
    setIsDragSupported(supported);
    setDragState(prev => ({ ...prev, isDragSupported: supported }));
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((visitId: string, dayIndex: number) => {
    setDragState(prev => ({
      ...prev,
      isDragging: true,
      draggedVisitId: visitId,
      dragSourceDay: dayIndex,
      dragTargetDay: null
    }));
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((dayIndex: number) => {
    setDragState(prev => ({
      ...prev,
      dragTargetDay: dayIndex
    }));
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDragState(prev => ({
      ...prev,
      isDragging: false,
      draggedVisitId: null,
      dragSourceDay: null,
      dragTargetDay: null
    }));
  }, []);

  // Handle drop
  const handleDrop = useCallback((visitId: string, fromDay: number, toDay: number) => {
    setDragState(prev => ({
      ...prev,
      isDragging: false,
      draggedVisitId: null,
      dragSourceDay: null,
      dragTargetDay: null
    }));
  }, []);

  return {
    isDragSupported,
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop
  };
} 