'use client'
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import styles from './navbar.module.css';
import { GoChevronDown, GoChevronUp } from "react-icons/go";


const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const faqRef = useRef(null);
  const [faqPosition, setFAQPosition] = useState({ top: 0, left: 0, width: 0 });

  const toggleNavbar = () => {
    setIsOpen(!isOpen);
    setIsFaqOpen(false)
  };

  const toggleFAQS = () => {
    setIsFaqOpen(!isFaqOpen);
  }

  useEffect(() => {
    const handleResize = () => {
      if (faqRef.current) {
        const rect = faqRef.current.getBoundingClientRect();
        setFAQPosition({ 
          top: rect.top + window.scrollY, 
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    };

    // Add event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);
    
    // Initial calculation
    handleResize();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, [isOpen]); // Add isOpen as dependency to recalculate when menu opens/closes

  return (
    <nav className={styles.navbar} onMouseLeave={() => window.innerWidth > 769 && setIsFaqOpen(false)}>
      <div className={styles.navbarContainer}>
        <Link href="/" className={styles.navbarBrand}>
          <img src="/logo.png" className={styles.logo}/>
        </Link>
        
        <button 
          className={styles.navbarToggle}
          onClick={toggleNavbar}
          aria-expanded={isOpen}
          aria-label="Toggle navigation"
        >
          <span className={styles.toggleIcon}></span>
          <span className={styles.toggleIcon}></span>
          <span className={styles.toggleIcon}></span>
        </button>

        <div className={`${styles.navbarMenu} ${isOpen ? styles.show : ''}`}>
          <ul className={styles.navbarNav}>
            <li className={styles.navItem}>
              <Link href="/" className={styles.navLink} onClick={() => setIsOpen(false)}>
                Home
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/companyStores" className={styles.navLink} onClick={() => setIsOpen(false)}>
                Company Stores
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/services" className={styles.navLink} onClick={() => setIsOpen(false)}>
                Services
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/vendors" className={styles.navLink} onClick={() => setIsOpen(false)}>
                Vendors
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/gallery" className={styles.navLink} onClick={() => setIsOpen(false)}>
                Gallery
              </Link>
            </li>
            <li className={styles.navItem}>
              <Link href="/contact" className={styles.navLink} onClick={() => setIsOpen(false)}>
                Contact Us
              </Link>
            </li>
            <li 
              ref={faqRef}
              className={`${styles.navItem} ${styles.hasDropdown} ${isFaqOpen ? styles.active : ''}`}
              onMouseEnter={() => window.innerWidth > 769 && setIsFaqOpen(true)}
              onClick={() => toggleFAQS()}
            >
              <div 
                className={styles.navLink} style={{display: "flex", gap: "5px", alignItems:"center"}}
              >
                FAQs {isFaqOpen ? <GoChevronUp strokeWidth="2px"/> : <GoChevronDown strokeWidth="2px"/>}
              </div>
            </li>
            { isFaqOpen && window.innerWidth < 769 &&
                <div>
                  <li className={styles.navItem}>
                    <Link href="/howToOrder" className={styles.navLink} onClick={() => setIsOpen(false)}>
                      How to Order
                    </Link>
                    <Link href="/requestPortal" className={styles.navLink} onClick={() => setIsOpen(false)}>
                      Request Client Portal
                    </Link>
                    <Link href="/notifications" className={styles.navLink}  onClick={() => setIsOpen(false)}>
                      Text Notification Form
                    </Link>
                    <Link href="/termsAndConditions" className={styles.navLink} onClick={() => setIsOpen(false)}>
                      Terms & Conditions
                    </Link>
                </li>
              </div>
            }
          </ul>
          <Link href="https://dpipcoincdbapointofaction.shops.shopvox.com" className={styles.shopVoxStore} style={{display:'flex', gap: "10px", alignItems: "center"}}>
            <button className={styles.styledButton}>
              Online Store
            </button>
            <img src="/shopping_cart.png" className={styles.shoppingCart}/>
          </Link>
        </div>
      </div>
      { window.innerWidth > 769  && 
        <div className={styles.dropdown} 
        style={{position: "absolute", transform: "translate(-35%, 1rem)", 
        left: `${faqPosition.left}px`, overflow: `${isFaqOpen ? "auto" : "hidden"}`, 
        maxHeight: `${isFaqOpen ? "500px" : "0"}`, transition: "max-height 1s, padding 1s", 
        padding: `${isFaqOpen ? "25px" : "0 25px"}`}}
        onMouseLeave={() => window.innerWidth > 769 && setIsFaqOpen(false)}>
            <Link href="/howToOrder" className={styles.navLink} style={{color: "#837B7B"}} onClick={() => setIsOpen(false)}>
              How to Order
            </Link>
            <Link href="/requestPortal" className={styles.navLink} style={{color: "#837B7B"}} onClick={() => setIsOpen(false)}>
              Request Client Portal
            </Link>
            <Link href="/notifications" className={styles.navLink} style={{color: "#837B7B"}} onClick={() => setIsOpen(false)}>
              Text Notification Form
            </Link>
            <Link href="/termsAndConditions" className={styles.navLink} style={{color: "#837B7B"}} onClick={() => setIsOpen(false)}>
              Terms & Conditions
            </Link>
        </div>
    }
    </nav>
  );
};

export default Navbar;