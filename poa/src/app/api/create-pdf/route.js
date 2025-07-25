// /api/generate-box-pdf/route.js
import puppeteer from 'puppeteer';

export async function POST(request) {
  try {
    const { boxId, qrCode } = await request.json();
    
    
    // Generate HTML template
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px;
          color: #333;
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-items: center;
        }
        .header { 
          text-align: center; 
        }
        .qr-code { 
          text-align: center; 
        }
        .qr-code img { 
          width: 150px; 
          height: 150px; 
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Box #${boxId}</h1>
      </div>
      <div class="qr-code">
        <img src="${qrCode}"/>
      </div>
    </body>
    </html>
    `;
    
    // Generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    await browser.close();
    
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="box-${boxId}.pdf"`
      }
    });
    
  } catch (error) {
    console.error('PDF generation error:', error);
    return Response.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}

