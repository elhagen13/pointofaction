import styles from "./popup.module.css";
import { useEffect, useState, useCallback } from "react";

export default function Popup({ closePopup, closeOverlay = null, popupType }) {
  const popups = {
    unsaved: {
      title: "Unsaved Changes",
      subtext: [
        "Continue with saving: click save or press enter",
        "Continue without saving: click exit or press esc"
      ],
      backgroundColor: "#e0483d",
      color: "rgb(230, 195, 195)"
    },
    unsuccessful: {
      title: "Unsuccessful",
      subtext: [
        "Please try again",
      ],
      backgroundColor: "#e0483d",
      color: "rgb(230, 195, 195)"
    },
    success: {
      title: "Successfully updated",
      subtext: ["To exit: click exit or press esc"],
      backgroundColor: "#159939",
      color: "#aecfb7"
    },
    itemNotAdded: {
      title: "Need to add item",
      subtext: ["To add: press the checkmark to the right", "To continue without saving: click exit or press esc again"],
      backgroundColor: "#e88031",
      color: "#f0b07f"
    },
    delete: {
      title: "Item successfully deleted",
      subtext: [],
      backgroundColor: "#159939",
      color: "#aecfb7"
    },
  };
  
  const [time, setTime] = useState(0);

  // Remove the handleKeyDown from here since it's back in AddBox

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (time === 6) {
      closePopup();
    }
  }, [time, closePopup]);

  useEffect(() => {
    setTime(0)
  }, [popupType])

  return (
    <div className={styles.popup} style={{backgroundColor:popups[popupType].backgroundColor}}>
      <div className={styles.popupInner}>
        <div className={styles.title} >{popups[popupType].title}</div>
        {popups[popupType].subtext.map((line, index) => (
    <div key={index}>{line}</div>
  ))}
        <div
          className={`${styles.timedBar} ${time !== 0 ? styles.long : ""}`}
          style={{backgroundColor:popups[popupType].color}}
        ></div>
      </div>
    </div>
  );
}