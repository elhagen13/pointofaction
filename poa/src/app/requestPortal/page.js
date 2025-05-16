'use client'
import styles from "./portal.module.css"
import { useState } from "react";

export default function RequestPortal() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('');
  const [number, setNumber] = useState('');
  const [choice, setChoice] = useState('Opt In')



  
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
        <form className={styles.form}  action="mailto:eklhagen@gmail.com" method="post" encType="text/plain">
          <input className={styles.input_sm} name="Client First Name" value={name} onChange={(e) => setName(e.value)} placeholder="FIRST NAME" required></input>
          <input className={styles.input_sm} name="Client Last Name" value={name} onChange={(e) => setName(e.value)} placeholder="LAST NAME" required></input>
          <input className={styles.input_sm} name="Client Company" placeholder="COMPANY NAME" required></input>
          <input className={styles.input_md} name="Client Email" placeholder="EMAIL" type="email" required></input>
          <input className={styles.input_md} name="Client Phonenumber" placeholder="PHONE NUMBER" type="tel" required></input>
          <textarea className={styles.input_lg} name="Additional Info" placeholder="ADDITIONAL INFO" required></textarea>
          
          <button type="submit" value="send" className={styles.submitButton}>Submit</button>
        </form>

      </div>

    </div>
  );
}
