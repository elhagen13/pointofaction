"use client";
import Link from "next/link";
import styles from "./page.module.css";
import Banner from "./components/Banner";
import ServicesCarousel from "./components/servicesCarousel";
import CustomerCarousel from "./components/customerCarousel";
import { useState, useEffect } from "react";

export default function Home() {
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
        dayIndex: i
      });
    }
    
    return weekDates;
  }

  useEffect(() => {
    async function getWeeklyHours() {
      try {
        setLoading(true);
        const weekDates = getRemainingWeekDates();
        const hoursPromises = weekDates.map(async ({ dayName, date, dayIndex }) => {
          // Sunday (0) and Saturday (6) are closed
          if (dayIndex % 7 === 0 || dayIndex % 7 === 6) {
            return {
              dayName,
              date,
              status: 'CLOSED',
              hours: null
            };
          }
          
          try {
            const response = await fetch(`/api/hours?date=${date}`);
            if (response.ok) {
              const hours = await response.json();
              return {
                dayName,
                date,
                status: 'OPEN',
                hours: hours
              };
            } else if (response.status === 404) {
              // Default hours: 10am to 5pm
              return {
                dayName,
                date,
                status: 'DEFAULT',
                hours: {
                  startTime: '10:00',
                  endTime: '17:00',
                  open: true
                }
              };
            } else {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
          } catch (error) {
            console.error(`Error fetching hours for ${dayName} (${date}):`, error);
            // Fall back to default hours on error
            return {
              dayName,
              date,
              status: 'DEFAULT',
              hours: {
                startTime: '10:00',
                endTime: '17:00',
                open: true
              }
            };
          }
        });

        const results = await Promise.all(hoursPromises);
        
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
  }, []);

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
    <div>
      <Banner/>
      <div style={{padding: "20px", marginLeft: "20px", fontWeight: "bold"}}>
        This Week's Hours (Remaining Days):
        {loading ? (
          <div style={{marginTop: "10px"}}>Loading hours...</div>
        ) : (
          <div style={{marginTop: "10px", display: "grid", gridTemplateColumns: "repeat(7, 1fr", gap: "10px"}}>
            {Object.keys(weeklyHours).map((day, index) => (
              <div key={day} style={{padding: "8px", border: index !== 0 ?  "1px solid #ddd" : "1px solid #973636", borderRadius: "4px"}}>
                <div style={{fontWeight: "bold", fontSize: "14px"}}>{day}:</div>
                <div style={{fontSize: "12px", marginTop: "2px"}}>
                  {renderDayHours(day)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <main className={styles.main}>
        <div name="services" className={styles.homeItem}>
          <div className={styles.title}>
            Services
          </div>
          <Link href="/services">
            <div className={styles.learnMore}>
              Learn more →
            </div>
          </Link>
          <ServicesCarousel/>
        </div>
        <div name="sample_works" className={styles.homeItem}>
          <div className={styles.title}>
            Works from <br/> previous customers
          </div>
          <Link href="/gallery">
            <div className={styles.learnMore}>
              Go to full gallery →
            </div>
          </Link>
          <CustomerCarousel/>
        </div>
        <div name="about us" className={styles.homeItem}>
          <div className={styles.title}>
            About Us
          </div>
          <div className={styles.aboutUs}>
            <div className={styles.aboutUsItem}>
              <img src="/about_us/history.png" className={styles.aboutUsImage}/>
              <div className={styles.aboutUsText}>
                <div className={styles.subtitle}>Our History </div><br/>
                Point of Action opened in 1987 originally as a silk screen
                business and has expanded and grown to what it is today – a successful,
                quality marketing materials manufacturer on the California Central
                Coast
              </div>
            </div>
            <div className={styles.aboutUsItem}>
              <img src="/about_us/staff.png" className={styles.aboutUsImage}/>
              <div className={styles.aboutUsText}>
                <div className={styles.subtitle}>Our Staff </div><br/>
                P.O.A. prides itself on its experienced staff with master embroiderers,
                graphic designers, sign-makers, etchers, and silk-screeners. Our customer
                service group with friendly, knowledgeable, and professional personnel,
                will suggest ideas to help you stand out with the most impact while
                having a professional look.
              </div>
            </div>
            <div className={styles.aboutUsItem}>
              <img src="/about_us/process.png" className={styles.aboutUsImage}/>
              <div className={styles.aboutUsText}>
                <div className={styles.subtitle}>Our Process </div><br/>
                We supply embroidery and more for many businesses in the state of
                California as well as companies known nationally. The first step
                in any order is to give us a call, and we are always standing by
                to receive you.
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className={styles.footer}>
      </footer>
    </div>
  );
}