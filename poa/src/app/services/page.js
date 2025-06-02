'use client'
import { useState, useEffect, useMemo } from 'react';
import styles from './services.module.css';
import Link from 'next/link';
import services from './services';

const ServiceItem = ({ service, index }) => {
  const isEven = index % 2 === 0;
  
  return (
    <div className={styles.backgroundBlock}>
      {isEven ? (
        <>
          <img 
            src={service.video} 
            className={styles.photoLeft} 
            alt={service.name}
          />
          <Link href={service.link} className={`${styles.textBlock} ${styles.textBlockRight}`}>
            <h2 className={styles.serviceText}>{service.name}</h2>
            <div className={styles.learnMore}>LEARN MORE</div>
          </Link>
        </>
      ) : (
        <>
          <Link href={service.link} className={`${styles.textBlock} ${styles.textBlockLeft}`}>
            <h2 className={styles.serviceText}>{service.name}</h2>
            <div className={styles.learnMore}>LEARN MORE</div>
          </Link>
          <img 
            src={service.video} 
            className={styles.photoRight} 
            alt={service.name}
          />
        </>
      )}
    </div>
  );
};

export default function Services() {
  const servicesArray = useMemo(() => Object.values(services), []);
  const [allImagesLoaded, setAllImagesLoaded] = useState(false);

  useEffect(() => {
    const preloadImages = async () => {
      const imagePromises = servicesArray.map(service => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = resolve; // Resolve even on error to prevent hanging
          img.src = service.video;
        });
      });

      // Wait for all images to load
      await Promise.all(imagePromises);
      setAllImagesLoaded(true);
    };

    preloadImages();
  }, [servicesArray]);

  // Don't render anything until all images are loaded
  if (!allImagesLoaded) {
    return null; // Completely blank screen
  }

  return (
    <div>
      {servicesArray.map((service, index) => (
        <ServiceItem 
          key={service.id || service.name || index}
          service={service} 
          index={index}
        />
      ))}
    </div>
  );
}