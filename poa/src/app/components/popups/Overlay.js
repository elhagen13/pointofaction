import { useEffect } from "react";
import styles from "./overlay.module.css"
import { IoMdExit } from "react-icons/io";
import Popup from "./Popup";
export default function Overlay({ 
  children, 
  isVisible, 
  onClose, 
  popup, 
  setPopup, 
  unsavedChanges,
  setUnsavedChanges
}) {
  if (!isVisible) return null;

  
  return (
    <div className={styles.overlayBackground}>
      <div className={styles.overlay}>
        <div className={styles.exitContainer}>
          <div className={styles.exit} onClick={() => {!unsavedChanges ? onClose() : setPopup("unsaved"); setUnsavedChanges(false)}}>
            <h4 style={{ fontSize: "1rem" }}>exit</h4>
            <IoMdExit />
            {popup && (
              <Popup 
                closePopup={() => setPopup(null)} 
                closeOverlay={onClose} 
                popupType={popup}
              />
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
