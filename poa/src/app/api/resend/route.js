// src/app/api/email/route.js
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { MongoClient } from 'mongodb';

// Create transporter (configure for your email provider)
const transporter = nodemailer.createTransport({
  // For Gmail
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // your gmail address
    pass: process.env.EMAIL_PASS  // your app password
  }
  
  // For other SMTP providers, use:
  // host: process.env.SMTP_HOST,
  // port: process.env.SMTP_PORT,
  // secure: process.env.SMTP_SECURE === 'true',
  // auth: {
  //   user: process.env.SMTP_USER,
  //   pass: process.env.SMTP_PASS
  // }
});


// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = 'test';
const COLLECTION_NAME = 'emails';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DATABASE_NAME);

    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}


export async function GET(request){
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    
    // Exeute query
    const permissions = await collection
    .find({})
    .toArray();

    return Response.json({
      success: true,
      data: permissions,
    });
    
  } catch (error) {
    console.error('GET error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch eamil permissions',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    const {type, recipients} = await request.json();
    console.log(type, recipients)
    collection.findOneAndUpdate({
      type: type,
    }, {
      $set: {
        recipients: recipients
      }
    })
    
    return Response.json({
      success: true,
      message: 'Box updated successfully'
    });
    
  } catch (error) {
    console.error('PATCH error:', error);
    
    return Response.json(
      {
        success: false,
        error: 'Failed to update email',
        details: error.message
      },
      { status: 500 }
    );
  }
}


export async function POST(request) {
  try {
    const formData = await request.formData();

    // Get form type to determine which format to use
    const formType = formData.get("formType");

    console.log("Form type received:", formType);

    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);

    const newForm = formType.split("-").map(word => [...word][0].toUpperCase() + [...word].slice(1).join("")).join(" ");
    console.log(newForm)
    const data = await collection.findOne({type: newForm})
   
    let emailData;
    switch (formType) {
      case "product-request":
        emailData = await handleProductRequest(formData, data.recipients);
        break;
      case "store-request":
        emailData = await handleStoreRequest(formData, data.recipients);
        break;
      case "notification-request":
        emailData = await handleNotificationRequest(formData, data.recipients);
        break;
      case "product-reservation":
        emailData = await handleProductPurchase(formData, data.recipients);
        break;
      default:
        return NextResponse.json(
          { success: false, error: "Invalid form type" },
          { status: 400 }
        );
    }

    const emailResponse = await transporter.sendMail(emailData);
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

async function handleProductRequest(formData, recipients) {
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
    from: process.env.EMAIL_USER, // Changed from resend sender
    to: recipients,
    replyTo: email, // Allow replying to the sender
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
async function handleStoreRequest(formData, recipients) {
  const email = formData.get("email");
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const company = formData.get("company");
  const phone = formData.get("phone");
  const additionalInfo = formData.get("additionalInfo");

  return {
    from: process.env.EMAIL_USER,
    to: recipients,
    replyTo: email,
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
async function handleNotificationRequest(formData, recipients) {
  const email = formData.get("email");
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const phone = formData.get("phone");
  const choice = formData.get("choice");

  return {
    from: process.env.EMAIL_USER,
    to: recipients,
    replyTo: email,
    subject: `Notification Request: ${firstName} ${lastName}`,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
      Notification Change Request
    </h2>
    
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="color: #495057; margin-top: 0;">Contact Information</h3>
      <p><strong>Name:</strong> ${firstName} ${lastName}</p>
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

async function handleProductPurchase(formData, recipients) {
  const name = formData.get("customer");
  const email = formData.get("email")
  const reservation = formData.get("reservation");
  const orderTitle = formData.get("orderTitle");
  const soIn = formData.get("soIn");
  const reservationQuantity = formData.get("reservationQuantity");
  const link = formData.get("link")



 
  
  return {
    from: process.env.EMAIL_USER,
    to: recipients,
    replyTo: email,
    subject: `New Reservation`,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
      Product Reserved
    </h2>
    
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="color: #495057; margin-top: 0;">Info</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Reservation #:</strong> ${reservation}</a></p>
      <p><strong>Order Title:</strong> ${orderTitle || "N/A"}</a></p>
      <p><strong>SO#/IN#:</strong> ${soIn || "N/A"}</a></p>
      <p><strong>Total Reservation Quantity:</strong> ${reservationQuantity || "N/A"}</a></p>
      <p><strong>Reservation Link:</strong> ${link || "N/A"}</a></p>

    </div>
      
  </div>
    `,
  };
}