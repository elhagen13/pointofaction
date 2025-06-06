'use client'
import styles from "./portal.module.css"
import { useState } from "react";

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

  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const subject = `Add Product - ${company}`;
    const body = `Name: ${firstName} ${lastName}\n\nCompany: ${company}\n\nStyle:\n${style}\nColor:\n${color}\nDesign:\n${design}\nAdditional Information:\n${additionalInfo}\n\nContact Details:\nEmail: ${email}\nPhone: ${phone}`;
    
    window.location.href = `mailto:eklhagen@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className={styles.productPage}>
      <div className={styles.title}>Add a Product to Your Company Store</div>
      <form className={styles.form}>
        <div className={styles.info}>Contact Information*</div>
        <div className={`${styles.inputContainer} ${styles.lgContainer}`}>
          <label className={styles.label}>Company*</label>
          <input className={styles.input} value={company} 
            onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div className={`${styles.inputContainer} ${styles.smContainer}`}>
          <label className={styles.label}>First Name*</label>
          <input className={styles.input} value={firstName} 
            onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div className={`${styles.inputContainer} ${styles.smContainer}`}>
          <label className={styles.label}>Last Name*</label>
          <input className={styles.input} value={lastName} 
            onChange={(e) => setLastName(e.target.value)} />
        </div>
        <div className={`${styles.inputContainer} ${styles.smContainer}`}>
          <label className={styles.label}>Email*</label>
          <input className={styles.input} value={email} 
            onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className={`${styles.inputContainer} ${styles.smContainer}`}>
          <label className={styles.label}>Phone Number*</label>
          <input className={styles.input} value={phone} 
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
          <input className={styles.input} value={style} 
            onChange={(e) => setStyle(e.target.value)} />
        </div>
        <div className={`${styles.inputContainer} ${styles.smContainer}`}>
          <label className={styles.label}>Color*</label>
          <input className={styles.input} value={color} 
            onChange={(e) => setColor(e.target.value)} />
        </div>
        <div className={`${styles.inputContainer} ${styles.lgContainer}`}>
          <label className={styles.label}>Design*</label>
          <textarea className={`${styles.input} ${styles.textarea}`} value={design} 
            onChange={(e) => setDesign(e.target.value)} />
        </div>
        <div className={`${styles.inputContainer} ${styles.lgContainer}`}>
          <label className={styles.label}>Additional Info*</label>
          <textarea className={`${styles.input} ${styles.textarea}`} value={additionalInfo} 
            onChange={(e) => setAdditionalInfo(e.target.value)} />
        </div>
        <div style={{gridColumn: "span 3"}}/>
        <div className={styles.submitContainer}>
          <button onClick={handleSubmit}>Submit</button>
        </div>
      </form>
    </div>

  );
}