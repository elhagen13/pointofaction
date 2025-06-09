'use client'
import { useState, useEffect } from "react";

const Calendar = ({refresh = 0}) => {
    const [weeklyHours, setWeeklyHours] = useState({});
  const [loading, setLoading] = useState(true);

  function convertTo12Hour(militaryTime) {
    if (!militaryTime) return '';
    const [hours, minutes] = militaryTime.split(':');
    const hour24 = parseInt(hours, 10);
    const min = parseInt(minutes, 10);
    const period = hour24 >= 12 ? 'PM' : 'AM';
    let hour12 = hour24 % 12;
    if (hour12 === 0) hour12 = 12; 
    const formattedMinutes = min < 10 ? `0${min}` : min;
    return `${hour12}:${formattedMinutes} ${period}`;
  }

  function getRemainingWeekDates() {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    const weekDates = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Start from today and go to the end of the week
    for (let i = currentDay; i < currentDay + 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + (i - currentDay));
      weekDates.push({
        dayName: dayNames[i % 7],
        date: date.toISOString().split('T')[0], // YYYY-MM-DD format
        dayIndex: i % 7  // Fix: Use i % 7 instead of i
      });
    }
    
    return weekDates;
  }


  useEffect(() => {
    async function getWeeklyHours() {
      try {
        setLoading(true);
        const weekDates = getRemainingWeekDates();
        const results = [];
  
        // Make requests sequentially instead of concurrently
        for (const { dayName, date, dayIndex } of weekDates) {
          // Sunday (0) and Saturday (6) are closed
          if (dayIndex % 7 === 0 || dayIndex % 7 === 6) {
            results.push({
              dayName,
              date,
              status: 'CLOSED',
              hours: null
            });
            continue;
          }
          
          try {
            const response = await fetch(`/api/hours?date=${date}`);
            if (response.ok) {
              const hours = await response.json();
              results.push({
                dayName,
                date,
                status: 'OPEN',
                hours: hours
              });
            } else if (response.status === 404) {
              results.push({
                dayName,
                date,
                status: 'DEFAULT',
                hours: {
                  startTime: '10:00',
                  endTime: '17:00',
                  open: true
                }
              });
            } else {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
          } catch (error) {
            console.error(`Error fetching hours for ${dayName} (${date}):`, error);
            results.push({
              dayName,
              date,
              status: 'DEFAULT',
              hours: {
                startTime: '10:00',
                endTime: '17:00',
                open: true
              }
            });
          }
        }
  
        // Convert array to object with day names as keys
        const hoursObject = {};
        results.forEach(result => {
          hoursObject[result.dayName] = result;
        });
        
        setWeeklyHours(hoursObject);
        console.log('Weekly hours:', hoursObject);
      } catch (error) {
        console.error('Error fetching weekly hours:', error);
      } finally {
        setLoading(false);
      }
    }
  
    getWeeklyHours();
  }, [refresh]);

  function renderDayHours(dayName) {
    const dayData = weeklyHours[dayName];
    
    if (!dayData) return 'Loading...';
    
    switch (dayData.status) {
      case 'CLOSED':
        return 'CLOSED';
      case 'OPEN':
      case 'DEFAULT':
        if (dayData.hours && dayData.hours.open) {
          return `${convertTo12Hour(dayData.hours.startTime)} - ${convertTo12Hour(dayData.hours.endTime)}`;
        } else {
          return 'CLOSED';
        }
      default:
        return 'Unknown';
    }
  }
  return (
    <div style={{padding: "20px", marginLeft: "20px", fontWeight: "bold"}}>
        This Week's Hours:
        {loading ? (
          <div style={{marginTop: "10px"}}>Loading hours...</div>
        ) : (
          <div style={{marginTop: "10px", display: "grid", gridTemplateColumns: "repeat(7, 1fr", gap: "10px"}}>
            {Object.keys(weeklyHours).map((day, index) => (
              <div key={day} style={{padding: "8px", border: index !== 0 ?  "1px solid #ddd" : "1px solid red", borderRadius: "4px"}}>
                <div style={{fontWeight: "bold", fontSize: "14px"}}>{day}:</div>
                <div style={{fontSize: "12px", marginTop: "2px"}}>
                  {renderDayHours(day)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    
  );
};

export default Calendar;