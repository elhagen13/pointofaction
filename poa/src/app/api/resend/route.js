// src/app/api/resend/route.js
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    // Parse the FormData instead of JSON to handle file uploads
    const formData = await request.formData();
    
    // Extract form fields
    const email = formData.get('email');
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const company = formData.get('company');
    const phone = formData.get('phone');
    const style = formData.get('style');
    const color = formData.get('color');
    const design = formData.get('design');
    const additionalInfo = formData.get('additionalInfo');
    
    // Extract uploaded file
    const imageFile = formData.get('image');
    
    console.log('Form data received:', { email, firstName, lastName, company, phone, style, color, design, additionalInfo });
    console.log('Image file:', imageFile ? `${imageFile.name} (${imageFile.size} bytes)` : 'No image uploaded');

    // Prepare email data
    const emailData = {
      from: 'onboarding@resend.dev',
      to: ['ella.kl.hagen@gmail.com'],
      subject: `Add Product Request - ${company}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            New Product Request
          </h2>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #495057; margin-top: 0;">Contact Information</h3>
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Company:</strong> ${company}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>
          </div>
          
          <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #495057; margin-top: 0;">Product Details</h3>
            <p><strong>Style:</strong> ${style}</p>
            <p><strong>Color:</strong> ${color}</p>
            <p><strong>Design:</strong></p>
            <div style="background-color: white; padding: 10px; border-radius: 3px; white-space: pre-wrap;">${design}</div>
            <p><strong>Additional Information:</strong></p>
            <div style="background-color: white; padding: 10px; border-radius: 3px; white-space: pre-wrap;">${additionalInfo}</div>
            ${imageFile ? '<p><strong>Image:</strong> See attached file</p>' : '<p><strong>Image:</strong> No image provided</p>'}
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; font-size: 14px;">
              This email was sent from the Company Store product request form.
            </p>
          </div>
        </div>
      `,
      text: `
New Product Request

Contact Information:
Name: ${firstName} ${lastName}
Company: ${company}
Email: ${email}
Phone: ${phone}

Product Details:
Style: ${style}
Color: ${color}
Design: ${design}
Additional Information: ${additionalInfo}
Image: ${imageFile ? 'See attached file' : 'No image provided'}

---
This email was sent from the Company Store product request form.
      `
    };

    // Add attachment if image file exists
    if (imageFile && imageFile.size > 0) {
      // Convert file to buffer
      const buffer = await imageFile.arrayBuffer();
      const fileBuffer = Buffer.from(buffer);
      
      // Add attachment to email data
      emailData.attachments = [
        {
          filename: imageFile.name,
          content: fileBuffer,
        }
      ];
    }

    const emailResponse = await resend.emails.send(emailData);

    return NextResponse.json({ success: true, data: emailResponse });
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send email: ' + error.message
      },
      { status: 500 }
    );
  }
}