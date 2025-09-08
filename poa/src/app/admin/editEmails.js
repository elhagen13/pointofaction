"use client";
import { useState, useEffect, useMemo } from "react";
import styles from "./admin.module.css";
import { FaChevronDown, FaPlusCircle, FaRegTrashAlt } from "react-icons/fa";
import { BeatLoader } from "react-spinners";

function EditEmails({ onClose }) {
  const forms = [
    "Product Request",
    "Store Request",
    "Notification Request",
    "Product Reservation",
  ];
  const [formOpen, setFormOpen] = useState(null);
  const [formRecipients, setFormRecipients] = useState({
    "Product Request": {
      description:
        "A request from a client to add a product to their company store",
      recipients: [],
    },
    "Store Request": {
      description: "A request from a client to create a company store",
      recipients: [],
    },
    "Notification Request": {
      description:
        "A request from a client to change their preferences about text opt-in/out",
      recipients: [],
    },
    "Product Reservation": {
      description:
        "A request to pull items, either from a purchase of overstock or internal reservation",
      recipients: [],
    },
  });
  const [newEmail, setNewEmail] = useState("");
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    const response = await fetch("/api/resend", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    console.log(data.data);

    let recipients = {};
    for (const item of data.data) {
      recipients[item.type] = {
        description: formRecipients[item.type].description,
        recipients: item.recipients,
      };
    }
    setFormRecipients(recipients);
  };

  useEffect(() => {
    console.log(formRecipients);
  }, [formRecipients]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const addToRecipients = (type) => {
    if(!newEmail.trim()) return;
    setFormRecipients({
        ...formRecipients,
        [type]: {
            ...formRecipients[type],
            recipients: [
                ...formRecipients[type].recipients,
                newEmail
            ]
        }
    })
    setNewEmail("")
  }

  const removeFromRecipients = (type, index) => {
    setFormRecipients({
        ...formRecipients,
        [type]: {
            ...formRecipients[type],
            recipients: formRecipients[type].recipients.filter((r, i) => i !== index)
        }
    })
  }

  const saveChanges = async(type) => {
    setSubmitting(true)
    const response = await fetch("/api/resend", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            type: type,
            recipients: formRecipients[type].recipients
        })
    });
    if(!response.ok){
        alert("Email update failed")
    }
    setSubmitting(false)
  }

  return (
    <div className={styles.addStoreOverlay} onClick={handleOverlayClick}>
      <div className={styles.overlay} onClick={handleModalClick}>
        <div className={styles.title} style={{ marginBottom: "30px" }}>
          Edit Email Recipients
        </div>
        <div className={styles.options}>
          {forms.map((form, index) => (
            <div className={styles.formOptionsContainer}>
              <div
                className={styles.formOptions}
                onClick={() =>
                  {formOpen === index ? setFormOpen(null) : setFormOpen(index); setNewEmail("")}
                }
              >
                {form}
                <FaChevronDown
                  className={`${styles.chevron} ${formOpen === index ? styles.rotated : ""}`}
                />
              </div>
              {formOpen === index && (
                <div className={styles.recipients}>
                    
                  {formRecipients[form].recipients.map((recipient, i) => (
                    <div className={styles.recipient}>• {recipient} <FaRegTrashAlt className={styles.emailTrash} onClick={() => removeFromRecipients(form, i)}/></div>
                  )) }
                  <div className={styles.recipient}>
                    <div style={{position:"relative", backgroundColor:"white"}}>
                    <input className={styles.input} style={{paddingRight:"35px"}} placeholder="example@poa.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}/>
                    <FaPlusCircle className={styles.optionAdd} size={20} onClick={() => addToRecipients(form)} style={{position:"absolute", top:"25%", right:"10px"}}/>
                    </div>
                    <button className={styles.save} onClick={() => saveChanges(form)} disabled={submitting}>{submitting ? <BeatLoader size={4}/> : "Save"}</button>

                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Sale() {
  const [editEmailsOpen, setEditEmailsOpen] = useState(false);

  return (
    <>
      {editEmailsOpen && (
        <EditEmails onClose={() => setEditEmailsOpen(false)} />
      )}
      <div className={styles.addStore}>
        <div className={styles.titleBar}>
          <div className={styles.title}>Email Recipients</div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "15px",
            }}
          >
            <button
              className={styles.button}
              onClick={() => setEditEmailsOpen(true)}
            >
              Edit Emails
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sale;
