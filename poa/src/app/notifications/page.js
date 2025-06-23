"use client";
import styles from "./notifications.module.css";
import { useState } from "react";

export default function Notifications() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [choice, setChoice] = useState("I would like to receive SMS messages");
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMessage("");

    try {
      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append("formType", "notification-request");
      formData.append("email", email);
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("phone", phone);
      formData.append("choice", choice);

      // Send form dara to API
      const emailResponse = await fetch("/api/resend", {
        method: "POST",
        body: formData,
      });

      if (emailResponse.ok) {
        setSubmitMessage("Request sent successfully!");

        // Clear form
        setFirstName("");
        setLastName("");
        setEmail("");
        setPhone("");
      } else {
        const errorData = await emailResponse.json();
        setSubmitMessage(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitMessage("Error submitting form. Please try again.");
    }
  };

  return (
    <div className={styles.productPage}>
      <div className={styles.title}>Text Notification Opt-In/Opt-Out</div>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.info}>
          Contact Information*
          <div style={{ fontWeight: "normal", fontSize: "15px" }}>
            ABOUT SMS NOTIFICATIONS <br />
            At Point of Action, we use SMS text messages to keep our customers
            informed about their orders. These messages may include:
            <br />
            <br />
            - Order confirmations and updates
            <br />
            - Pickup or delivery notifications
            <br />
            - Questions or clarifications regarding your order
            <br />
            <br />
            Message frequency varies depending on order activity. Message and
            data rates may apply.
            <br />
            <br />
            OPTING OUT
            <br />
            If you no longer wish to receive SMS notifications from us, you may
            opt out at any time by either of the following methods:
            <br />
            - Complete our opt-out form below.
            <br />
            - Verbally request to opt out during any future interaction with our
            staff
            <br />- Once we receive your opt-out request, we will promptly
            update your preferences and stop sending text messages to your phone
            number.
          </div>
        </div>

        <div className={`${styles.inputContainer} ${styles.smContainer}`}>
          <label className={styles.label}>First Name*</label>
          <input
            className={styles.input}
            value={firstName}
            required
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div className={`${styles.inputContainer} ${styles.smContainer}`}>
          <label className={styles.label}>Last Name*</label>
          <input
            className={styles.input}
            value={lastName}
            required
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <div className={`${styles.inputContainer} ${styles.smContainer}`}>
          <label className={styles.label}>Email*</label>
          <input
            className={styles.input}
            type="email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className={`${styles.inputContainer} ${styles.smContainer}`}>
          <label className={styles.label}>Phone Number*</label>
          <input
            className={styles.input}
            value={phone}
            required
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className={`${styles.inputContainer} ${styles.lgContainer}`}>
          <label className={styles.label}>Notification Preference*</label>
          <select
            name="Opt-In/Opt-Out"
            className={styles.dropdown}
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            required
          >
            <option value="I would like to receive SMS messages">
              Opt-In (I would like to receive SMS Messages)
            </option>
            <option value="I don't want to receive SMS messages">
              Opt-Out (I don't want to receive SMS Messages)
            </option>
          </select>
        </div>

        <div style={{ gridColumn: "span 3" }} />
        <div className={styles.submitContainer}>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>

        {submitMessage && (
          <div
            style={{
              gridColumn: "span 4",
              textAlign: "center",
              marginTop: "10px",
            }}
          >
            <p
              style={{
                color: submitMessage.includes("Error") ? "red" : "green",
              }}
            >
              {submitMessage}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
