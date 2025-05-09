'use client'
import { useState } from 'react';
import Link from 'next/link';
import styles from './navbar.module.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleNavbar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className={styles.navbar}>
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
            <li className={styles.navItem}>
              <Link href="/faqs" className={styles.navLink} onClick={() => setIsOpen(false)}>
                FAQs
              </Link>
            </li>
          </ul>
          <Link href="https://dpipcoincdbapointofaction.shops.shopvox.com" style={{display:'flex', gap: "10px", alignItems: "center"}}>
            <button className={styles.styledButton}>
              Online Store
            </button>
            <img src="/shopping_cart.png" className={styles.shoppingCart}/>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;