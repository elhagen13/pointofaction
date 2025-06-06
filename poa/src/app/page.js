"use client";
import Link from "next/link";
import styles from "./page.module.css";
import Banner from "./components/Banner";
import ServicesCarousel from "./components/servicesCarousel";
import CustomerCarousel from "./components/customerCarousel";
import { useState, useEffect } from "react";
export default function Home() {
  const [hours, setHours] = useState([])

  function convertTo12Hour(militaryTime) {
    // Handle empty or invalid input
    if (!militaryTime) return '';
    
    // Split the time string (e.g., "17:00" -> ["17", "00"])
    const [hours, minutes] = militaryTime.split(':');
    
    // Convert to numbers
    const hour24 = parseInt(hours, 10);
    const min = parseInt(minutes, 10);
    
    // Determine AM/PM
    const period = hour24 >= 12 ? 'PM' : 'AM';
    
    // Convert hour to 12-hour format
    let hour12 = hour24 % 12;
    if (hour12 === 0) hour12 = 12; // Handle midnight (0) and noon (12)
    
    // Format minutes with leading zero if needed
    const formattedMinutes = min < 10 ? `0${min}` : min;
    
    return `${hour12}:${formattedMinutes} ${period}`;
  }

  useEffect(() => {
    async function getTodaysHours() {
      try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        const response = await fetch(`/api/hours?date=${today}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            console.log('No hours found for today');
            return null;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const hours = await response.json();
        console.log('Today\'s hours:', hours);
        setHours(hours)
        return hours;
        
      } catch (error) {
        console.error('Error fetching today\'s hours:', error);
        return null;
      }
    }

    getTodaysHours()
  }, [])
  return (
    <div>
       <Banner/>
       <div style={{padding: "20px", marginLeft: "20px"}}>
          Hours today:
          <div>
            {convertTo12Hour(hours.startTime)}-{convertTo12Hour(hours.endTime)}
          </div>
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
              quality marketing materials manufacturer on the California Central
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
