'use client'
import styles from './galleryCarousel.module.css';
import { useState } from 'react';
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";


export default function Carousel({ images}) {
    const [activePage, setActivePage] = useState(0);

    const position = (index) => {
        if (index === activePage) return styles.active;
        if ((index + 1) % images.length === activePage) return styles.med_left;
        if ((index - 1 + images.length) % images.length === activePage) return styles.med_right;
        if ((index + 2) % images.length === activePage) return styles.small_left;
        if ((index - 2 + images.length) % images.length === activePage) return styles.small_right;
        return styles.hidden;
    }

    return (
        <div className={styles.carouselContainer}>
            <div className={styles.navButtons}>
                <div className={styles.circles}>
                    <HiChevronLeft className={styles.navButton} onClick={() => setActivePage((activePage - 1 < 0 ? images.length - 1 : activePage - 1))}/>
                </div>
                <div className={styles.circles}>
                <HiChevronRight className={styles.navButton} onClick={() => setActivePage((activePage + 1) % images.length)}/>
                </div>

            </div>
            <div className={styles.carousel}>
                {images.map((image, index) => (
                    <div
                        key={index}
                        className={`${styles.imageContainer} ${position(index)}`}
                    >
                        <img
                            src={image.imageLink}
                            className={styles.image}
                            alt={`Gallery item ${index}`}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
