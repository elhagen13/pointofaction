'use client'
import styles from "./notifications.module.css"
import { useState } from "react";

export default function Notifications() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [choice, setChoice] = useState('I would like to receive SMS messages');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const subject = "SMS Notification Preference Update";
    const body = `Dear Point of Action team,\n\nI would like to ${choice.includes("don't") ? "opt out" : "opt in"} to SMS notifications.\n\nMy details:\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nPreferred status: ${choice}\n\nThank you,\n${name}`;
    
    window.location.href = `mailto:austin@pointofaction.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className={styles.notificationPage}>
      <div className={styles.title}>Text Notification Opt-In/Opt-Out</div>
      <div className={styles.text}>
        ABOUT SMS NOTIFICATIONS <br/>
        At Point of Action, we use SMS text messages to keep our customers informed about their orders. These messages may include:
        <br/><br/>
        - Order confirmations and updates
        <br/><br/>
        - Pickup or delivery notifications
        <br/><br/>
        - Questions or clarifications regarding your order
        <br/><br/>
        Message frequency varies depending on order activity. Message and data rates may apply.
        <br/>
      </div>
      <div className={styles.text}>
        OPTING OUT
        <br/>
        If you no longer wish to receive SMS notifications from us, you may opt out at any time by either of the following methods:
        <br/><br/>
        - Complete our opt-out form below.
        <br/><br/>
        - Verbally request to opt out during any future interaction with our staff
        <br/><br/>
        - Once we receive your opt-out request, we will promptly update your preferences and stop sending text messages to your phone number.
      </div>
      <div className={styles.text}>
        OPT-IN/OPT-OUT
        <form className={styles.form} onSubmit={handleSubmit}>
          <input 
            className={styles.input_sm} 
            name="Client Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="NAME" 
            required
          />
          <input 
            className={styles.input_sm} 
            name="Client Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="EMAIL" 
            type="email" 
            required
          />
          <input 
            className={styles.input_sm} 
            name="Client Phonenumber" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="PHONE NUMBER" 
            type="tel" 
            required
          />
          <select 
            name="Opt-In/Opt-Out" 
            className={styles.input_lg} 
            style={{height: "45px", borderRadius: "20px", backgroundColor: "white"}} 
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            required
          >
            <option value="I would like to receive SMS messages">Opt-In (I would like to receive SMS Messages)</option>
            <option value="I don't want to receive SMS messages">Opt-Out (I don't want to receive SMS Messages)</option>
          </select>
          <button type="submit" className={styles.submitButton}>Submit</button>
        </form>
      </div>
    </div>
  );
}