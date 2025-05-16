'use client'
import styles from "./notifications.module.css"
import { useState } from "react";

export default function Notifications() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('');
  const [number, setNumber] = useState('');
  const [choice, setChoice] = useState('Opt In')



  
  return (
    <div className={styles.notificationPage}>
      <div className={styles.title}>Text Notification Opt-In/Opt-Out</div>
      <div className={styles.text}>
        ABOUT SMS NOTIFICATIONS <br/>
        At Point of Action, we use SMS text messages to keep our customers informed about their orders. These messages may include:
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
        - Verbally request to opt out during any future interaction with our staff
        <br/><br/>
        - Once we receive your opt-out request, we will promptly update your preferences and stop sending text messages to your phone number.
      </div>
      <div className={styles.text}>
        OPT-IN/OPT-OUT
        <form className={styles.form}  action="mailto:eklhagen@gmail.com" method="post" encType="text/plain">
          <input className={styles.input_sm} name="Client Name" value={name} onChange={(e) => setName(e.value)} placeholder="NAME" required></input>
          <input className={styles.input_sm} name="Client Email" placeholder="EMAIL" type="email" required></input>
          <input className={styles.input_sm} name="Client Phonenumber" placeholder="PHONE NUMBER" type="tel" required></input>
          <select name="Opt-In/Opt-Out" id="opt" className={styles.input_lg} style={{height: "45px", borderRadius: "20px", backgroundColor: "white"}} required>
            <option value="I would like to receive SMS messages">Opt-In (I would like to receive SMS Messages)</option>
            <option value="I don't want to receive SMS messages">Opt-Out (I don't want to receive SMS Messages)</option>
          </select>
          <button type="submit" value="send" className={styles.submitButton}>Submit</button>
        </form>

      </div>

    </div>
  );
}
