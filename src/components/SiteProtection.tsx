'use client';

import { useEffect } from 'react';

export default function SiteProtection() {
  useEffect(() => {
    // Disable right click (context menu)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Disable developer tools & view source keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.metaKey && e.altKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        ((e.ctrlKey || e.metaKey) && ['U', 'S', 'P'].includes(e.key.toUpperCase()))
      ) {
        e.preventDefault();
      }
    };

    // Disable dragging of images/content
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  return null;
}
