'use client'
import styles from './banner.module.css';
import { useState, useRef, useEffect } from 'react';
import BannerItem from './BannerItem';

const bannerItems = [
    {
        image: "/banner1.png",
        obj1: "/logo-alt.png",
        obj2: "POA provides customized, attractive, and high-quality products in bulk for businesses and organizations locally and throughout the United States. With numerous state-of-the-art machines, we take your ideas and turn them into real, ground breaking products that you and your organization will love!"
    },
    {
        image: "/banner1.png",
        obj1: null,
        obj2: "fjdsflkdsjfldsk"
    },
    {
        image: "/banner1.png",
        obj1: "/logo-alt.png",
        obj2: "fsdkfjdsflkdjsflskdfjdsf"
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
            <BannerItem 
                image={bannerItems[curPage].image} 
                obj1={bannerItems[curPage].obj1}
                obj2={bannerItems[curPage].obj2}
            />
            <div className={styles.portalBanner}>
                Planning to reorder often?
                <div className={styles.portalBannerButtons}>
                    <button className={styles.portalBannerButton}>
                        Request a Client Portal
                    </button>
                    <button className={styles.portalBannerButton}>
                        Client Portal Login
                    </button>
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