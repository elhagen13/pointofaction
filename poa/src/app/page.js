'use client'
import { useState, useEffect } from 'react';
import Link from "next/link";
import styles from "./page.module.css";
import Banner from "./components/Banner";
import ServicesCarousel from "./components/servicesCarousel";
import CustomerCarousel from "./components/customerCarousel";

// Define all critical images that should be preloaded
const criticalImages = [
  "/banner1.png",
  "/banner2.png", 
  "/banner3.png",
  "/about_us/history.png",
  "/about_us/staff.png",
  "/about_us/process.png"
];

export default function Home() {
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    const preloadImages = async () => {
      const imagePromises = criticalImages.map(src => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = () => {
            console.warn(`Failed to load image: ${src}`);
            resolve(); // Don't let one failed image block the page
          };
          img.src = src;
        });
      });

      try {
        await Promise.all(imagePromises);
        setPageReady(true);
      } catch (error) {
        console.error('Error preloading images:', error);
        setPageReady(true); // Show page even if there are errors
      }
    };

    preloadImages();
  }, []);

  // Show nothing (or a loading spinner) until images are ready
  if (!pageReady) {
    return (
      <div className={styles.loadingContainer}>
        {/* Optional: Add a loading spinner or skeleton */}
        <div className={styles.loader}>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <Banner/>
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