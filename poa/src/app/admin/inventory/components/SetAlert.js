import { useState, useEffect, useMemo, useRef } from "react";
import { FaRegBell, FaRegBellSlash } from "react-icons/fa";
import styles from "./setAlert.module.css"
import { BeatLoader } from "react-spinners";

export default function SetAlert({ keyDict, getKey, item, refresh }) {
  const [alertOn, setAlertOn] = useState(keyDict[getKey(item)])
  const [curState, setCurState] = useState(alertOn)
  const [visible, setVisible] = useState(false);
  const [inventoryQuant, setInventoryQuant] = useState(keyDict[getKey(item)]?.quantity || "");
  const [submitting, setSubmitting] = useState(false)
  const [key, setKey] = useState(getKey(item))

  const saveSettings = async () => {
    if (submitting) return;
    console.log(key)
    setSubmitting(true);

    try {
      let response;

      if (curState && !alertOn) {
        // Turning ON the alert - POST
        const keyData = {
          key: key,
          quantity: inventoryQuant
        };
        response = await fetch("/api/inventory/tracker", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(keyData),
        });
      } 
      else if (curState && alertOn) {
        // Alert is already ON but quantity changed - PATCH
        const keyId = keyDict[key]?._id;
        const keyData = {
          quantity: inventoryQuant
        };
        response = await fetch(`/api/inventory/tracker/${keyId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(keyData),
        });
      }
      else if (!curState && alertOn) {
        // Turning OFF the alert - DELETE
        const keyId = keyDict[key]?._id;
        console.log(keyId);
        response = await fetch(`/api/inventory/tracker/${keyId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      if (response && !response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state to reflect the change
      setAlertOn(curState);
      setVisible(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      // Reset to previous state on error
      setCurState(alertOn);
      setInventoryQuant(keyDict[getKey(item)]?.quantity || "");
    } finally {
      setSubmitting(false);
      setVisible(false)
      refresh();
    }
  }

  return (
    <div className={styles.alert}>
      <div onClick={() => setVisible(true)}>
        {alertOn ?
          <FaRegBell />
          :
          <FaRegBellSlash />}
      </div>
      {visible &&
        <div className={styles.popup} onMouseLeave={() => { setVisible(false); setCurState(alertOn); setInventoryQuant(keyDict[getKey(item)]?.quantity || "") }}>
          <div className={styles.alertHeader}>
            Alert
            <div className={`${styles.toggle} ${curState ? styles.on : styles.off}`} onClick={() => setCurState(!curState)}>
              <div className={`${styles.toggleButton} ${curState ? styles.end : styles.start}`}></div>
            </div>
          </div>
          {curState &&
            <input value={inventoryQuant} onChange={(e) => setInventoryQuant(e.target.value)} />
          }
          <button onClick={saveSettings} disabled={submitting ||
            (curState && !inventoryQuant) ||
            (curState && !parseInt(inventoryQuant))}
          >
            {submitting ? <BeatLoader size={9} /> : "Save"}
          </button>
        </div>
      }
    </div>
  )
}