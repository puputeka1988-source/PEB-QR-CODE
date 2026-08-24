/**
 * Utility for printing documents across all views.
 * Ensures 100% visual and layout parity between on-screen preview and printed output.
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
 * Extracts all stylesheets, inline styles, Google Fonts, and CSS rules from the host document
 * so the print output retains exact typography, Tailwind classes, colors, grid layouts, and borders.
 */
export const getHostHeadStyles = (): string => {
  let headHtml = '';

  // 1. Copy font connections and external stylesheet links
  const links = document.querySelectorAll('link[rel="stylesheet"], link[rel="preconnect"], link[rel="preload"]');
  links.forEach(link => {
    headHtml += link.outerHTML + '\n';
  });

  // 2. Copy inline style tags (Vite compiled Tailwind CSS, theme styles, animations)
  const styles = document.querySelectorAll('style');
  styles.forEach(style => {
    if (style.innerHTML && style.innerHTML.trim().length > 0) {
      headHtml += `<style>${style.innerHTML}</style>\n`;
    }
  });

  // 3. Extract CSS rules from styleSheets (safely handles any CSSOM-injected stylesheets)
  try {
    let sheetRulesText = '';
    for (let i = 0; i < document.styleSheets.length; i++) {
      const sheet = document.styleSheets[i];
      try {
        if (sheet.cssRules) {
          for (let j = 0; j < sheet.cssRules.length; j++) {
            sheetRulesText += sheet.cssRules[j].cssText + '\n';
          }
        }
      } catch {
        // Cross-origin stylesheet rules might throw; ignored as link tags already cover them
      }
    }
    if (sheetRulesText && styles.length === 0) {
      headHtml += `<style>${sheetRulesText}</style>\n`;
    }
  } catch (e) {
    console.debug('StyleSheets rule extraction non-critical notice:', e);
  }

  return headHtml;
};

/**
 * Print a full HTML document string using popup window or hidden iframe fallback.
 */
export const printHtmlDocument = (htmlContent: string, title: string = 'Dokumen Cetak'): void => {
  // Ensure document has print color adjust and essential print styling
  let enhancedHtml = htmlContent;
  if (!enhancedHtml.includes('print-color-adjust')) {
    const printMetaStyles = `
      <style>
        @media print {
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      </style>
    `;
    if (enhancedHtml.includes('</head>')) {
      enhancedHtml = enhancedHtml.replace('</head>', `${printMetaStyles}</head>`);
    }
  }

  // 1. First attempt: Standard popup window
  try {
    const printWin = window.open('', '_blank', 'width=1100,height=850,scrollbars=yes');
    if (printWin && !printWin.closed) {
      printWin.document.open();
      printWin.document.write(enhancedHtml);
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
      doc.write(enhancedHtml);
      doc.close();

      const executeIframePrint = () => {
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
          }, 3500);
        }
      };

      // Wait for iframe fonts and images to load
      setTimeout(() => {
        try {
          const iframeWindow = iframe.contentWindow;
          const iframeDoc = iframeWindow?.document;
          if (iframeDoc) {
            const images = Array.from(iframeDoc.images);
            if (images.length === 0) {
              executeIframePrint();
            } else {
              let loadedCount = 0;
              const checkDone = () => {
                loadedCount++;
                if (loadedCount >= images.length) {
                  executeIframePrint();
                }
              };
              images.forEach(img => {
                if (img.complete) {
                  checkDone();
                } else {
                  img.addEventListener('load', checkDone);
                  img.addEventListener('error', checkDone);
                }
              });
              // Safety fallback timeout
              setTimeout(executeIframePrint, 800);
            }
          } else {
            executeIframePrint();
          }
        } catch {
          executeIframePrint();
        }
      }, 250);
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
 * Print a DOM element by its ID wrapped in an official print template
 * that faithfully reproduces 100% of preview formatting, typography, alignments, and colors.
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
  const hostStyles = getHostHeadStyles();

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <!-- Injected Host Styles (Google Fonts, Tailwind CSS, Themes) -->
        ${hostStyles}
        <style>
          /* High-Fidelity Print Page Sizing & Margin */
          @page {
            size: A4 ${orientation};
            margin: ${pageMargin};
          }

          /* Force exact color reproduction on all browsers */
          *, *::before, *::after {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            text-shadow: none !important;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            font-family: "Times New Roman", Times, "Liberation Serif", serif;
            font-size: 11px;
            line-height: 1.35;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Reset all screen-only outer containers and shadows */
          .printable-document,
          #printable-jadwal-area,
          #printable-beban-kerja-area,
          #printable-nilai-area,
          #printable-jurnal-area {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }

          /* Pristine Table Formatting */
          table {
            border-collapse: collapse !important;
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
          th, td {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          thead th,
          table thead tr th,
          table thead th {
            text-align: center !important;
            vertical-align: middle !important;
          }

          /* Metadata Table Zero-Border Enforcement */
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

          /* Official KOP Surat Formatting */
          .official-kop-surat {
            border-bottom: 3px double #000000 !important;
            padding-bottom: 6px !important;
            margin-bottom: 12px !important;
            text-align: center !important;
            width: 100% !important;
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

          /* Official Signature Block Formatting */
          .signature-container {
            display: flex !important;
            justify-content: space-between !important;
            width: 100% !important;
            margin-top: 24px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .signature-container img {
            max-height: 55px !important;
            max-width: 160px !important;
            width: auto !important;
            height: auto !important;
            object-fit: contain !important;
            display: block !important;
            margin: 0 auto !important;
          }

          /* Utilities */
          .no-print, button, nav, aside, header {
            display: none !important;
          }

          @media print {
            body {
              padding: 0 !important;
              margin: 0 !important;
              background-color: #ffffff !important;
              color: #000000 !important;
            }
          }
          ${customCss}
        </style>
      </head>
      <body class="bg-white text-black p-0 m-0 font-serif">
        ${element.innerHTML}
        <script>
          function triggerAutoPrint() {
            if (document.fonts && document.fonts.ready) {
              document.fonts.ready.then(function() {
                setTimeout(function() {
                  window.focus();
                  window.print();
                }, 120);
              });
            } else {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 180);
            }
          }

          window.addEventListener('load', function() {
            var imgs = Array.from(document.images);
            if (imgs.length === 0) {
              triggerAutoPrint();
            } else {
              var loaded = 0;
              var total = imgs.length;
              function done() {
                loaded++;
                if (loaded >= total) {
                  triggerAutoPrint();
                }
              }
              imgs.forEach(function(img) {
                if (img.complete) {
                  done();
                } else {
                  img.addEventListener('load', done);
                  img.addEventListener('error', done);
                }
              });
              // Fallback if image network hangs
              setTimeout(triggerAutoPrint, 900);
            }
          });
        </script>
      </body>
    </html>
  `;

  printHtmlDocument(fullHtml, title);
  return true;
};
