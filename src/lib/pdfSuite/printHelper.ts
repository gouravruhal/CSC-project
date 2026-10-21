export type PrintSizeMode = 'fit-page' | 'passport' | 'id-card' | 'actual';

export interface PrintImageOptions {
  mode?: PrintSizeMode;
  title?: string;
}

/**
 * Prints an image directly via an isolated print iframe, ensuring zero UI glitches
 * and precise sizing for government passport, ID card, or full A4 printing.
 */
export function printImageDocument(
  imageDataUrlOrBlob: string | Blob,
  options: PrintImageOptions = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    let srcUrl = '';
    let isCreatedObjectUrl = false;

    if (typeof imageDataUrlOrBlob === 'string') {
      srcUrl = imageDataUrlOrBlob;
    } else {
      srcUrl = URL.createObjectURL(imageDataUrlOrBlob);
      isCreatedObjectUrl = true;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const cleanup = () => {
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        if (isCreatedObjectUrl) URL.revokeObjectURL(srcUrl);
        resolve();
      }, 1000);
    };

    const mode = options.mode || 'fit-page';
    let sizeCss = 'max-width: 100%; max-height: 94vh; object-fit: contain;';

    if (mode === 'passport') {
      sizeCss = 'width: 3.5cm; height: 4.5cm; object-fit: cover; border: 1px dashed #666;';
    } else if (mode === 'id-card') {
      sizeCss = 'width: 8.6cm; height: 5.4cm; object-fit: cover; border: 1px dashed #666;';
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${options.title || 'Print Document'}</title>
          <style>
            @page {
              size: auto;
              margin: 10mm;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: #fff;
            }
            img {
              ${sizeCss}
              display: block;
              image-rendering: -webkit-optimize-contrast;
            }
          </style>
        </head>
        <body>
          <img id="print-target" src="${srcUrl}" alt="Print Document" />
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `;

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      cleanup();
      reject(new Error('Print document context unavailable'));
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    iframe.contentWindow?.addEventListener('afterprint', cleanup);
    // Safety timeout in case user cancels or browser doesn't fire afterprint
    setTimeout(cleanup, 60000);
  });
}
