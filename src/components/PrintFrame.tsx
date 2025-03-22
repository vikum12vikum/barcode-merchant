
import { ReactNode, useEffect, useRef } from 'react';

interface PrintFrameProps {
  content: string;
  onPrintSuccess?: () => void;
  onPrintError?: (error: any) => void;
}

/**
 * A component for printing content without opening a new tab
 * @param content - HTML content to print
 * @param onPrintSuccess - Callback after successful print
 * @param onPrintError - Callback on print error
 */
const PrintFrame = ({ content, onPrintSuccess, onPrintError }: PrintFrameProps) => {
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Create the print operation
    const printContent = () => {
      if (!frameRef.current) return;
      
      const frameDoc = frameRef.current.contentWindow?.document;
      if (!frameDoc) return;
      
      // Write content to the iframe
      frameDoc.open();
      frameDoc.write(content);
      frameDoc.close();
      
      // Wait for resources to load before printing
      setTimeout(() => {
        try {
          frameRef.current?.contentWindow?.print();
          onPrintSuccess?.();
        } catch (error) {
          console.error("Printing failed", error);
          onPrintError?.(error);
        }
      }, 500);
    };

    // Execute print when the component mounts
    if (content) {
      printContent();
    }
  }, [content, onPrintSuccess, onPrintError]);

  return (
    <iframe
      ref={frameRef}
      style={{
        position: 'fixed',
        right: '0',
        bottom: '0',
        width: '0',
        height: '0',
        border: '0'
      }}
      title="Print Frame"
    />
  );
};

export default PrintFrame;
