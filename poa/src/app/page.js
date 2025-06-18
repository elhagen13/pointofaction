"use client";
import Link from "next/link";
import Head from "next/head";
import styles from "./page.module.css";
import Banner from "./components/Banner";
import Calendar from "./components/Calendar";
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
    <>
    <Head>
        <title>Point of Action - Embroidery, Signs & Custom Marketing Solutions | Central Coast</title>
        <meta name="description" content="Point of Action has been serving the Central Coast since 1987 with professional embroidery, custom signs, and marketing solutions. Expert staff, quality craftsmanship." />
        <meta name="keywords" content="embroidery, custom signs, marketing, Central Coast, silk screen, Point of Action" />
        <meta property="og:title" content="Point of Action - Custom Embroidery & Signs" />
        <meta property="og:description" content="Professional embroidery and custom marketing solutions since 1987" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://pointofaction.com" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "Point of Action",
              "description": "Professional embroidery, custom signs, and marketing solutions since 1987",
              "foundingDate": "1987",
              "url": "https://pointofaction.com"
            })
          }}
        />
      </Head>
    <div>
      <Banner/>
      <Calendar/>
      <main className={styles.main}>
        <div name="services" className={styles.homeItem} style={{marginTop: "3rem"}}>
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
                business and has expanded and grown to what it is today – a successful marketing value added reseller on the Central Coast.
              </div>
            </div>
            <div className={styles.aboutUsItem}>
              <img src="/about_us/staff.png" className={styles.aboutUsImage}/>
              <div className={styles.aboutUsText}>
                <div className={styles.subtitle}>Our Staff </div><br/>
                P.O.A. prides itself on its experienced staff with master embroiderers,
                graphic designers, sign-makers, and etchers. Our customer
                service group with friendly, knowledgeable, and professional personnel,
                will suggest ideas to help you stand out with the most impact in todays market.
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
    </>
  );
}