import React, { useEffect, useRef } from 'react';

interface PreviewProps {
  code: string;
  language: string;
}

const Preview: React.FC<PreviewProps> = ({ code, language }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && code) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (doc) {
        if (language === 'html') {
          doc.open();
          doc.write(code);
          doc.close();
        } else if (language === 'javascript') {
          doc.open();
          doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Code Preview</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .output { background: #f5f5f5; padding: 10px; border-radius: 4px; margin: 10px 0; }
              </style>
            </head>
            <body>
              <h3>JavaScript Output:</h3>
              <div class="output" id="output"></div>
              <script>
                try {
                  const output = document.getElementById('output');
                  const result = eval(\`${code}\`);
                  output.innerHTML = '<strong>Result:</strong> ' + JSON.stringify(result, null, 2);
                } catch (error) {
                  document.getElementById('output').innerHTML = '<strong>Error:</strong> ' + error.message;
                }
              </script>
            </body>
            </html>
          `);
          doc.close();
        } else {
          doc.open();
          doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Code Preview</title>
              <style>
                body { font-family: 'Courier New', monospace; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
                pre { margin: 0; white-space: pre-wrap; }
              </style>
            </head>
            <body>
              <pre>${code}</pre>
            </body>
            </html>
          `);
          doc.close();
        }
      }
    }
  }, [code, language]);

  return (
    <div className="h-full bg-white">
      <div className="flex items-center justify-between p-2 border-b border-gray-300">
        <h3 className="text-sm font-medium text-gray-700">Preview</h3>
        <div className="text-xs text-gray-500">{language}</div>
      </div>
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0"
        title="Code Preview"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};

export default Preview; 