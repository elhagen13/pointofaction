"use client";
import { useState, useEffect } from "react";
import styles from "./admin.module.css";
import { FaRegEdit, FaUpload, FaTimes } from "react-icons/fa";
import AddCompanyStore from "./addStore.js";
import Calendar from "../components/Calendar";

function Admin() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("17:00");
  const [open, setOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSubmitHours = async () => {
    // Validation
    if (!startDate || !endDate) {
      alert("Please select a date");
      return;
    }

    if (startTime >= endTime) {
      alert("Start time must be before end time");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/hours", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: startDate,
          endDate: endDate,
          startTime: startTime,
          endTime: endTime,
          open: open,
          updatedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Hours updated successfully:", result);
      alert("Hours updated successfully!");
      setRefreshKey(prev => prev + 1);

    } catch (error) {
      console.error("Error updating hours:", error);
      alert("Failed to update hours. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.admin}>
      <div className={styles.title}>Change Hours</div>
      
      <div className={styles.schedule}>
        <div className={styles.scheduleChange}>
          <div>
            <label htmlFor="start-date" style={{ fontSize: '14px', fontWeight: 'bold', display: 'block' }}>
              Date Range
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ flex: 1, minWidth: '140px' }}
              />
              <span style={{ color: '#666', fontSize: '14px' }}>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ flex: 1, minWidth: '140px' }}
              />
            </div>
          </div>
          
          <div>
            <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block' }}>
              Status
            </label>
            <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="radio"
                  id="open"
                  name="status"
                  value="Open"
                  checked={open}
                  onChange={() => setOpen(true)}
                  style={{ width: '18px', height: '18px' }}
                />
                <label htmlFor="open" style={{ cursor: 'pointer', userSelect: 'none' }}>Open</label>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="radio"
                  id="close"
                  name="status"
                  value="Close"
                  checked={!open}
                  onChange={() => setOpen(false)}
                  style={{ width: '18px', height: '18px' }}
                />
                <label htmlFor="close" style={{ cursor: 'pointer', userSelect: 'none' }}>Close</label>
              </div>
            </div>
          </div>
          
          {open && (
            <div>
              <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block' }}>
                Hours
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={{ flex: 1, minWidth: '120px' }}
                />
                <span style={{ color: '#666', fontSize: '14px' }}>to</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={{ flex: 1, minWidth: '120px' }}
                />
              </div>
            </div>
          )}
          
          <div>
            <button
              className={styles.button}
              onClick={handleSubmitHours}
              disabled={isSubmitting}
              style={{ 
                width: isMobile ? '100%' : 'auto',
                marginTop: '10px'
              }}
            >
              {isSubmitting ? "Updating..." : "Change Hours"}
            </button>
          </div>
        </div>
        
        {!isMobile && (
          <div style={{ flex: 2, minWidth: '300px' }}>
            <Calendar refresh={refreshKey}/>
          </div>
        )}
      </div>
      
      {isMobile && (
        <div style={{ margin: '20px 0' }}>
          <Calendar refresh={refreshKey}/>
        </div>
      )}
      
      <AddCompanyStore />
    </div>
  );
}

export default Admin;