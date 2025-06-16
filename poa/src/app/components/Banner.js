'use client'
import styles from './banner.module.css';
import { useState, useRef, useEffect } from 'react';
import BannerItem from './BannerItem';
import Link from 'next/link';

const bannerItems = [
  {
    image: "/banner1-min.jpeg",
  },
  {
    image: "/banner2-min.jpeg",
  },
  {
    image: "/banner3-min.jpeg",
  }
]

const bannerMobileItems = [
  {
    image: "/banner1mobile-min.jpeg"
  },
  {
    image: "/banner2mobile-min.jpeg"
  },
  {
    image: "/banner3mobile-min.jpeg"
  },
]

const Banner = () => {
  const [curPage, setCurPage] = useState(0);
  const [startX, setStartX] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSmall, setIsSmall] = useState(window.innerWidth < 769);
  const bannerRef = useRef(null);

  
  const checkSize = () => {
    setIsSmall(window.innerWidth < 769)
  }

  window.addEventListener("resize", checkSize);

  // Auto-advance banner
  useEffect(() => {
    console.log(isSmall)
    const currentItems = isSmall ? bannerMobileItems : bannerItems;
    const interval = setInterval(() => {
      setCurPage(prev => (prev === currentItems.length - 1 ? 0 : prev + 1));
    }, 10000);

    return () => clearInterval(interval);
  }, [isSmall]);

  // Handle touch start
  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  // Handle touch move
  const handleTouchMove = (e) => {
    if (!startX || !isDragging) return;
    
    // Prevent default to avoid scrolling while swiping
    e.preventDefault();
  };

  // Handle touch end
  const handleTouchEnd = (e) => {
    if (!startX || !isDragging) return;
    
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    const swipeThreshold = 50;
    const currentItems = isSmall ? bannerMobileItems : bannerItems;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe left - next image
        setCurPage(prev => (prev === currentItems.length - 1 ? 0 : prev + 1));
      } else {
        // Swipe right - previous image
        setCurPage(prev => (prev === 0 ? currentItems.length - 1 : prev - 1));
      }
    }

    setStartX(null);
    setIsDragging(false);
  };

  // Handle mouse events for desktop
  const handleMouseDown = (e) => {
    setStartX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!startX || !isDragging) return;
    e.preventDefault();
  };

  const handleMouseUp = (e) => {
    if (!startX || !isDragging) return;
    
    const endX = e.clientX;
    const diff = startX - endX;
    const swipeThreshold = 50;
    const currentItems = isSmall ? bannerMobileItems : bannerItems;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        setCurPage(prev => (prev === currentItems.length - 1 ? 0 : prev + 1));
      } else {
        setCurPage(prev => (prev === 0 ? currentItems.length - 1 : prev - 1));
      }
    }

    setStartX(null);
    setIsDragging(false);
  };

  return (
    <div className={styles.bannerWrapper}>
      <div
        ref={bannerRef}
        className={styles.bannerContainer}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setStartX(null);
          setIsDragging(false);
        }}
      >
        <div className={styles.portalBanner}>
          <span className={styles.portalBannerText}>Planning to reorder often?</span>
          <div className={styles.portalBannerButtons}>
            <Link href="/requestPortal" className={styles.portalBannerButton}>
              Request Portal
            </Link>
            <Link href="https://portal.shopvox.com/sign-in" className={styles.portalBannerButton}>
              Portal Login
            </Link>
          </div>
        </div>
        <div className={styles.bannerImageContainer}>
          <img 
            src={isSmall ? bannerMobileItems[curPage].image : bannerItems[curPage].image} 
            className={styles.bannerImage}
            alt={`Banner ${curPage + 1}`}
            draggable={false}
          />
        </div>
        <div className={styles.selectBanner}>
          <div className={styles.selectBannerButtons}>
            {(isSmall ? bannerMobileItems : bannerItems).map((_, index) => (
              <button
                key={index}
                className={`${styles.bannerButton} ${curPage === index ? styles.active : ""}`}
                onClick={() => setCurPage(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;