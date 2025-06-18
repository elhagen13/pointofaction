'use client'
import styles from "./portal.module.css"
import { useState } from "react";

export default function RequestPortal() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [submitMessage, setSubmitMessage] = useState('')


  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMessage('');


    try {
      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append('formType', 'store-request');
      formData.append('email', email);
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('company', company);
      formData.append('phone', phone);
      formData.append('additionalInfo', additionalInfo);

      // Send form dara to API
      const emailResponse = await fetch('/api/resend', {
        method: 'POST',
        body: formData,
      });

      if (emailResponse.ok) {  
        setSubmitMessage('Request sent successfully!');
      
        // Clear form
        setFirstName('');
        setLastName('');
        setCompany('');
        setEmail('');
        setPhone('');
        setAdditionalInfo('');
        
      } else {
        const errorData = await emailResponse.json();
        setSubmitMessage(`Error: ${errorData.error}`);

      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitMessage('Error submitting form. Please try again.');

    } finally {
    }
  }


  return (
    <div className={styles.notificationPage}>
      <div className={styles.title}>Planning to Reorder Often?</div>
      <div className={styles.text}>
        <div style={{fontWeight:"bold"}}>Company stores streamline the reordering process by giving you 
        instant access to your complete order history.</div><br/><br/>

        Instead of recreating past orders from scratch, you can quickly review, duplicate, or 
        modify previous purchases with just a few clicks. This not only saves time but also 
        ensures consistency across repeat orders—whether you're restocking the same products
        or making slight adjustments.<br/><br/>

        With real-time visibility into past designs, pricing, and specifications, you can 
        place new orders with confidence, reducing back-and-forth communication and minimizing 
        errors. The portal also allows you to track order statuses, manage approvals, and 
        store frequently used items for even faster checkout.<br/><br/>

        By simplifying reorders, our company stores help you maintain efficiency, improve 
        turnaround times, and keep your branding consistent across all projects. Our team 
        can also assist in setting up custom workflows within your portal to further optimize 
        your ordering experience.<br/><br/>
      </div>
      <div className={styles.text} >
        <div style={{fontWeight:"bold", marginBottom: "15px"}}>Interested? Reach out to us!</div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <input 
            className={styles.input_sm} 
            name="Client First Name" 
            value={firstName} 
            onChange={(e) => setFirstName(e.target.value)} 
            placeholder="FIRST NAME" 
            required
          />
          <input 
            className={styles.input_sm} 
            name="Client Last Name" 
            value={lastName} 
            onChange={(e) => setLastName(e.target.value)} 
            placeholder="LAST NAME" 
            required
          />
          <input 
            className={styles.input_sm} 
            name="Client Company" 
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="COMPANY NAME" 
            required
          />
          <input 
            className={styles.input_md} 
            name="Client Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="EMAIL" 
            type="email" 
            required
          />
          <input 
            className={styles.input_md} 
            name="Client Phonenumber" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="PHONE NUMBER" 
            type="tel" 
            required
          />
          <textarea 
            className={styles.input_lg} 
            name="Additional Info" 
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            placeholder="ADDITIONAL INFO" 
          />
          
          <button type="submit" className={styles.submitButton}>Submit</button>
          {submitMessage && (
          <div style={{gridColumn: "span 6", fontWeight: "bold", textAlign: "center", marginTop: "10px"}}>
            <p style={{color: submitMessage.includes('Error') ? 'red' : 'green'}}>
              {submitMessage}
            </p>
          </div>
        )}
        </form>
      </div>
    </div>
  );
}