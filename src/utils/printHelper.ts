/**
 * Utility for printing documents across all views.
 * Works seamlessly in sandboxed iframes, desktop browsers, and mobile devices
 * by combining popup window and hidden iframe printing fallback.
 */

export interface PrintElementOptions {
  title?: string;
  orientation?: 'portrait' | 'landscape';
  customCss?: string;
  pageMargin?: string;
}

/**
 * Print a full HTML document string using popup window or hidden iframe fallback.
 */
export const printHtmlDocument = (htmlContent: string, title: string = 'Dokumen Cetak'): void => {
  // 1. First attempt: Standard popup window
  try {
    const printWin = window.open('', '_blank', 'width=1100,height=850,scrollbars=yes');
    if (printWin && !printWin.closed) {
      printWin.document.open();
      printWin.document.write(htmlContent);
      printWin.document.close();
      printWin.focus();
      return;
    }
  } catch (e) {
    console.warn('Popup window blocked, switching to hidden iframe print fallback:', e);
  }

  // 2. Second attempt: Hidden iframe print method (works 100% inside sandboxed iframe without popup permission)
  try {
    const oldIframe = document.getElementById('universal-print-iframe');
    if (oldIframe) {
      oldIframe.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'universal-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (err) {
          console.error('Error invoking iframe.print():', err);
          window.focus();
          window.print();
        } finally {
          setTimeout(() => {
            if (iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
          }, 3000);
        }
      }, 500);
      return;
    }
  } catch (err) {
    console.error('Failed to create iframe for print:', err);
  }

  // 3. Fallback to main window print
  window.focus();
  window.print();
};

/**
 * Print a DOM element by its ID wrapped in an official print template.
 */
export const printElementById = (
  elementId: string,
  options: PrintElementOptions = {}
): boolean => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Element with ID '${elementId}' not found for printing.`);
    window.focus();
    window.print();
    return false;
  }

  const orientation = options.orientation || 'landscape';
  const title = options.title || 'Dokumen Cetak Resmi';
  const pageMargin = options.pageMargin || '8mm';
  const customCss = options.customCss || '';

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          @page {
            size: A4 ${orientation};
            margin: ${pageMargin};
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Times New Roman', Times, 'Liberation Serif', serif;
            margin: 0;
            padding: 8mm;
            color: #000000;
            background-color: #ffffff;
            font-size: 11px;
            line-height: 1.3;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          h1, h2, h3, h4 {
            color: #000000;
            margin-top: 0;
          }
          table:not(.meta-table):not(.meta-table-left):not(.meta-table-right) {
            width: 100%;
            border-collapse: collapse;
            text-align: center;
            margin-top: 6px;
            margin-bottom: 14px;
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          th, td {
            border: 1px solid #000000;
            padding: 4px 6px;
            font-size: 10px;
          }
          th, thead th, table thead tr th {
            background-color: #f1f5f9 !important;
            font-weight: bold;
            color: #000000;
            text-align: center !important;
            vertical-align: middle !important;
          }
          table.meta-container-table,
          .meta-container-table {
            width: 100% !important;
            border-collapse: collapse !important;
            border: none !important;
            margin-top: 4px !important;
            margin-bottom: 14px !important;
          }
          table.meta-table-left,
          .meta-table-left {
            width: auto !important;
            margin-left: 0 !important;
            margin-right: auto !important;
            border-collapse: collapse !important;
            border: none !important;
          }
          table.meta-table-right,
          .meta-table-right {
            width: auto !important;
            margin-left: auto !important;
            margin-right: 0 !important;
            border-collapse: collapse !important;
            border: none !important;
          }
          table.meta-table,
          .meta-table {
            border-collapse: collapse !important;
            border: none !important;
          }
          table.meta-table tr,
          table.meta-container-table tr,
          .meta-table tr,
          .meta-container-table tr {
            border: none !important;
            background: transparent !important;
          }
          table.meta-table td,
          table.meta-table th,
          table.meta-container-table td,
          table.meta-container-table th,
          .meta-table td,
          .meta-table th,
          .meta-container-table td,
          .meta-container-table th {
            border: none !important;
            padding: 2px 2px !important;
            font-size: 11px !important;
            background: transparent !important;
          }
          .official-kop-surat {
            border-bottom: 3px double #000000 !important;
            padding-bottom: 6px !important;
            margin-bottom: 12px !important;
            text-align: center !important;
          }
          img {
            max-width: 100%;
          }
          .official-kop-surat img,
          .kop-logo img,
          .header-logo img,
          img.kop-img {
            width: 54px !important;
            height: 54px !important;
            max-width: 54px !important;
            max-height: 54px !important;
            object-fit: contain !important;
            display: block !important;
            margin: 0 auto !important;
          }
          .official-kop-surat .logo-container,
          .official-kop-surat > div > div:first-child,
          .official-kop-surat > div > div:last-child {
            width: 56px !important;
            height: 56px !important;
            min-width: 56px !important;
            max-width: 56px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex-shrink: 0 !important;
          }
          .signature-container img {
            max-height: 50px !important;
            max-width: 160px !important;
            width: auto !important;
            height: auto !important;
            object-fit: contain !important;
            display: block !important;
            margin: 0 auto !important;
          }
          .font-bold { font-weight: bold !important; }
          .font-black { font-weight: 900 !important; }
          .font-mono { font-family: monospace !important; }
          .font-sans { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; }
          .font-serif { font-family: 'Times New Roman', Times, serif !important; }
          .uppercase { text-transform: uppercase !important; }
          .underline { text-decoration: underline !important; }
          .italic { font-style: italic !important; }
          .text-left { text-align: left !important; }
          .text-center { text-align: center !important; }
          .text-right { text-align: right !important; }
          .flex { display: flex !important; }
          .items-center { align-items: center !important; }
          .justify-between { justify-content: space-between !important; }
          .justify-end { justify-content: flex-end !important; }
          .w-full { width: 100% !important; }
          .signature-container {
            display: flex !important;
            justify-content: space-between !important;
            width: 100% !important;
            margin-top: 24px !important;
            page-break-inside: avoid !important;
          }
          .no-print, button, nav, aside, header {
            display: none !important;
          }
          @media print {
            body {
              padding: 0 !important;
              background-color: #ffffff !important;
              color: #000000 !important;
            }
          }
          ${customCss}
        </style>
      </head>
      <body>
        ${element.innerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 350);
          };
        </script>
      </body>
    </html>
  `;

  printHtmlDocument(fullHtml, title);
  return true;
};
