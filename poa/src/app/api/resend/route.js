// src/app/api/resend/route.js
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const formData = await request.formData();

    // Get form type to determine which format to use
    const formType = formData.get("formType");

    console.log("Form type received:", formType);

    let emailData;

    switch (formType) {
      case "product-request":
        emailData = await handleProductRequest(formData);
        break;
      case "store-request":
        emailData = await handleStoreRequest(formData);
        break;
      case "notification-request":
        emailData = await handleNotificationRequest(formData);
        break;
      default:
        return NextResponse.json(
          { success: false, error: "Invalid form type" },
          { status: 400 }
        );
    }

    const emailResponse = await resend.emails.send(emailData);
    return NextResponse.json({ success: true, data: emailResponse });
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send email: " + error.message,
      },
      { status: 500 }
    );
  }
}

async function handleProductRequest(formData) {
  const email = formData.get("email");
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const company = formData.get("company");
  const phone = formData.get("phone");
  const style = formData.get("style");
  const color = formData.get("color");
  const design = formData.get("design");
  const additionalInfo = formData.get("additionalInfo");
  const imageFile = formData.get("image");

  const emailData = {
    from: "onboarding@resend.dev",
    to: ["ella.kl.hagen@gmail.com"],
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
          ${imageFile ? "<p><strong>Image:</strong> See attached file</p>" : "<p><strong>Image:</strong> No image provided</p>"}
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="color: #6c757d; font-size: 14px;">
            This email was sent from the Company Store product request form.
          </p>
        </div>
      </div>
    `,
  };

  // Handle image attachment
  if (imageFile && imageFile.size > 0) {
    const buffer = await imageFile.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);

    emailData.attachments = [
      {
        filename: imageFile.name,
        content: fileBuffer,
      },
    ];
  }

  return emailData;
}

// Contact Form Handler
async function handleStoreRequest(formData) {
  const email = formData.get("email");
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const company = formData.get("company");
  const phone = formData.get("phone");
  const additionalInfo = formData.get("additionalInfo");

  return {
    from: "onboarding@resend.dev",
    to: ["ella.kl.hagen@gmail.com"],
    subject: `Store Request: ${company}`,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
      Store Request
    </h2>
    
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="color: #495057; margin-top: 0;">Contact Information</h3>
      <p><strong>Name:</strong> ${firstName} ${lastName}</p>
      <p><strong>Company:</strong> ${company}</p>
      <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
      <p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>
    </div>
    
    <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="color: #495057; margin-top: 0;">Additional Info</h3>
      <p><strong>Additional Information:</strong></p>
      <div style="background-color: white; padding: 10px; border-radius: 3px; white-space: pre-wrap;">${additionalInfo}</div>
    </div>
    
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
      <p style="color: #6c757d; font-size: 14px;">
        This email was sent from the portal request form.
      </p>
    </div>
  </div>
    `,
  };
}

// Support Ticket Handler
async function handleNotificationRequest(formData) {
  const email = formData.get("email");
  const name = formData.get("name");
  const phone = formData.get("phone");
  const choice = formData.get("choice");

  return {
    from: "onboarding@resend.dev",
    to: ["ella.kl.hagen@gmail.com"],
    subject:  `Notification Request: ${name}`,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
      Notification Change Request
    </h2>
    
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="color: #495057; margin-top: 0;">Contact Information</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
      <p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>
    </div>
    
    <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="color: #495057; margin-top: 0;">Choice</h3>
      <p><strong>Choice:</strong> ${choice}</p>
    </div>
    
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
      <p style="color: #6c757d; font-size: 14px;">
        This email was sent from the notifications request form.
      </p>
    </div>
  </div>
    `,
  };
}
