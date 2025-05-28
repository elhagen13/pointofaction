'use client'
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import styles from './footer.module.css';
import { GoChevronDown, GoChevronUp } from "react-icons/go";

const Footer = () => {
  const [mobileView, setMobileView] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth <= 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <footer className={styles.footer}>
      <div className={styles.logo}>
        <img src="/logo.png" alt="Point of Action Logo" className={styles.logoImage}/>
        <div className={styles.social}>
          <Link href="https://www.facebook.com/p/Point-of-Action-100066848020006/">
            <img src="/facebookIcon.png" alt="Facebook" className={styles.socialIcon}/>
          </Link>
          <Link href="https://www.instagram.com/point_of_action_official/">
            <img src="/instagramIcon.png" alt="Instagram" className={styles.socialIcon}/>
          </Link>
        </div>
      </div>
      
      <div className={styles.contactInfo}>
        1 (805) 922 - 6253
        <br/>
        orders@pointofaction.com
        <br/><br/>
        2232 South Depot Street
        <br/>
        Santa Maria, CA 93455
      </div>
      
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Quick Links</h3>
        <div className={styles.links}>
          <Link href="/" className={styles.link}>Home</Link>
          <Link href="/companyStores" className={styles.link}>Company Stores</Link>
          <Link href="/services" className={styles.link}>Services</Link>
          <Link href="/vendors" className={styles.link}>Vendors</Link>
          <Link href="/gallery" className={styles.link}>Gallery</Link>
          <Link href="/contact" className={styles.link}>Contact Us</Link>
        </div>
      </div>
      
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Services</h3>
        <div className={styles.links}>
          <Link href="/services/embroidery" className={styles.link}>Embroidery</Link>
          <Link href="/services/vinyl" className={styles.link}>Vinyl Printing & Cutting</Link>
          <Link href="/services/laser" className={styles.link}>Laser Etching</Link>
          <Link href="/services/film" className={styles.link}>Direct to Film</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;