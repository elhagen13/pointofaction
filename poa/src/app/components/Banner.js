'use client'
import styles from './banner.module.css';
import { useState, useRef, useEffect } from 'react';
import BannerItem from './BannerItem';
import Link from 'next/link';

const bannerItems = [
    {
        image: "/banner1.png",
    },
    {
        image: "/banner2.png",
       
    },
    {
        image: "/banner3.png",
    }
]

const Banner = () => {
    const [curPage, setCurPage] = useState(0);
    const [startX, setStartX] = useState(null);
    const bannerRef = useRef(null);

    // Handle touch start
    const handleTouchStart = (e) => {
        setStartX(e.touches[0].clientX);
    };

    // Handle touch move
    const handleTouchMove = (e) => {
        if (!startX) return;
        
        const currentX = e.touches[0].clientX;
        const diff = startX - currentX;
    };

    // Handle touch end
    const handleTouchEnd = (e) => {
        if (!startX) return;

        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX;

        const swipeThreshold = 50;

        if (diff > swipeThreshold) {
            setCurPage(prev => (prev === bannerItems.length - 1 ? 0 : prev + 1));
        } else if (diff < -swipeThreshold) {
            setCurPage(prev => (prev === 0 ? bannerItems.length - 1 : prev - 1));
        }

        setStartX(null);
    };

   
    return (
        <div 
            ref={bannerRef}
            className={styles.bannerContainer}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
             <div className={styles.bannerContainer}>
                <img src={bannerItems[curPage].image} className={styles.bannerImage} />
            </div>
            <div className={styles.portalBanner}>
                Planning to reorder often?
                <div className={styles.portalBannerButtons}>
                    <Link href="/requestPortal"className={styles.portalBannerButton}>
                        Request a Client Portal
                    </Link>
                    <Link href="https://portal.shopvox.com/sign-in" className={styles.portalBannerButton}>
                        Client Portal Login
                    </Link>
                </div>

            </div>
            <div className={styles.selectBanner}>
                <div className={styles.selectBannerButtons}>
                    {bannerItems.map((_, index) => (
                        <div 
                            key={index}
                            className={`${styles.bannerButton} ${curPage === index ? styles.active : ""}`} 
                            onClick={() => setCurPage(index)}
                        ></div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Banner;