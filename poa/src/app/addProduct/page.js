'use client'
import styles from "./portal.module.css"
import { useState } from "react";
import { FaRegEdit, FaUpload, FaTimes } from "react-icons/fa";

export default function RequestPortal() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [style, setStyle] = useState('');
  const [color, setColor] = useState('');
  const [design, setDesign] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setSelectedImage(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    // Reset the file input
    const fileInput = document.getElementById('file-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append('formType', 'product-request');
      formData.append('email', email);
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('company', company);
      formData.append('phone', phone);
      formData.append('style', style);
      formData.append('color', color);
      formData.append('design', design);
      formData.append('additionalInfo', additionalInfo);
      
      // Add image file if selected
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      // Send form data to API
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
        setStyle('');
        setColor('');
        setDesign('');
        setAdditionalInfo('');
        setSelectedImage(null);
        
        // Reset file input
        const fileInput = document.getElementById('file-upload');
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        const errorData = await emailResponse.json();
        setSubmitMessage(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitMessage('Error submitting form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.productPage}>
      <div className={styles.title}>Add a Product to Your Company Store</div>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.info}>Contact Information*</div>
        <div className={`${styles.inputContainer} ${styles.lgContainer}`}>
          <label className={styles.label}>Company*</label>
          <input className={styles.input} value={company} required
            onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div className={`${styles.inputContainer} ${styles.smContainer}`}>
          <label className={styles.label}>First Name*</label>
          <input className={styles.input} value={firstName} required
            onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div className={`${styles.inputContainer} ${styles.smContainer}`}>
          <label className={styles.label}>Last Name*</label>
          <input className={styles.input} value={lastName} required
            onChange={(e) => setLastName(e.target.value)} />
        </div>
        <div className={`${styles.inputContainer} ${styles.smContainer}`}>
          <label className={styles.label}>Email*</label>
          <input className={styles.input} type="email" value={email} required
            onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className={`${styles.inputContainer} ${styles.smContainer}`}>
          <label className={styles.label}>Phone Number*</label>
          <input className={styles.input} value={phone} required
            onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div style={{gridColumn: "span 4", height: "20px"}}></div>
        <div className={styles.info}>
          Product Information*
          <div style={{fontWeight: "normal", fontSize: "15px"}}>
            <br/>
            Please input the information of the product you would like to add to your company store. 
            <br/><br/>
            The style is the catalog number of the product you want, and the design is a description of which of the designs from your previous orders you would like to use.
          </div>
        </div>
        <div className={`${styles.inputContainer} ${styles.smContainer}`}>
          <label className={styles.label}>Style*</label>
          <input className={styles.input} value={style} required
            onChange={(e) => setStyle(e.target.value)} />
        </div>
        <div className={`${styles.inputContainer} ${styles.smContainer}`}>
          <label className={styles.label}>Color*</label>
          <input className={styles.input} value={color} required
            onChange={(e) => setColor(e.target.value)} />
        </div>
        <div className={`${styles.inputContainer} ${styles.lgContainer}`}>
          <label className={styles.label}>Design*</label>
          <textarea className={`${styles.input} ${styles.textarea}`} value={design} required
            onChange={(e) => setDesign(e.target.value)} />
        </div>
        <div className={`${styles.inputContainer} ${styles.lgContainer}`}>
          <label className={styles.label}>Additional Info*</label>
          <textarea className={`${styles.input} ${styles.textarea}`} value={additionalInfo} required
            onChange={(e) => setAdditionalInfo(e.target.value)} />
        </div>
        <div style={{gridColumn: "span 2"}}/>
        <div className={`${styles.uploadSection} ${styles.inputContainer} ${styles.lgContainer}`}>
          <input
            type="file"
            accept="image/*"
            className={styles.fileInput}
            id="file-upload"
            onChange={handleImageChange}
          />
          <label htmlFor="file-upload" className={styles.fileLabel}>
            <FaUpload /> Choose Image File
          </label>
          {selectedImage && (
            <div style={{marginTop: "10px", display: "flex", alignItems: "center", gap: "10px"}}>
              <span style={{fontSize: "14px", color: "#666"}}>
                Selected: {selectedImage.name} ({Math.round(selectedImage.size / 1024)}KB)
              </span>
              <button 
                type="button" 
                onClick={removeImage}
                style={{
                  background: "none",
                  border: "none",
                  color: "#dc3545",
                  cursor: "pointer",
                  padding: "2px"
                }}
              >
                <FaTimes />
              </button>
            </div>
          )}
        </div>

        <div style={{gridColumn: "span 3"}}/>
        <div className={styles.submitContainer}>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
        
        {submitMessage && (
          <div style={{gridColumn: "span 4", textAlign: "center", marginTop: "10px"}}>
            <p style={{color: submitMessage.includes('Error') ? 'red' : 'green'}}>
              {submitMessage}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}