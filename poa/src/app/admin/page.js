"use client";
import { useState, useEffect } from "react";
import styles from "./admin.module.css";
import { FaRegEdit, FaUpload, FaTimes } from "react-icons/fa";
import AddCompanyStore from "./addStore.js"

function Admin() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("17:00");
  const [open, setOpen] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const response = await fetch('/api/hours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate,
          endDate: endDate,
          startTime: startTime,
          endTime: endTime,
          open: open,
          updatedAt: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Hours updated successfully:', result);
      alert('Hours updated successfully!');
      
      // Optionally reset form
      // setSelectedDate("");
      // setStartTime("10:00");
      // setEndTime("17:00");
      
    } catch (error) {
      console.error('Error updating hours:', error);
      alert('Failed to update hours. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.admin}>
      <div className={styles.title}>Change Hours</div>
      <div className={styles.scheduleChange}>
        <div>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          -
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div style={{display: "flex", gap: "10px"}}>
          <div style={{display: "flex", gap: "5px", alignItems: "center"}}>
            <input type="radio" id="open" name="status" value="Open" checked={open} onClick={() => setOpen(true)}/>
            <label for="open">Open</label></div>
          <div style={{display: "flex", gap: "5px", alignItems: "center"}}>
            <input type="radio" id="close" name="status" value="Close" checked={!open} onClick={() => setOpen(false)} />
            <label for="close">Close</label>
          </div>
        </div>
        {open && <div>
          <input 
            type="time" 
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          /> - 
          <input 
            type="time" 
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>}
        <div>
          <button 
            className={styles.button} 
            style={{padding: "5px 10px"}}
            onClick={handleSubmitHours}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Change Hours"}
          </button>
        </div>
      </div>
      <AddCompanyStore/>
    </div>
  );
}

export default Admin;