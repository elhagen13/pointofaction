'use client'
import { useRef, useMemo, useCallback } from 'react';
import styles from './services.module.css';
import Link from 'next/link';
import services from './services';

// Memoized service item component to prevent unnecessary re-renders
const ServiceItem = ({ service, index }) => {
  const isEven = index % 2 === 0;
  const videoRef = useRef(null);

  // Handle video hover effects (optional)
  const handleMouseEnter = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  return (
    <div className={styles.backgroundBlock}>
      {isEven ? (
        <>
          <video
            ref={videoRef}
            src={service.video}
            className={styles.photoLeft}
            width={500}
            height={300}
            muted
            loop
            playsInline
            preload="metadata"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            Your browser does not support the video tag.
          </video>
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
          <video
            ref={videoRef}
            src={service.video}
            className={styles.photoRight}
            width={500}
            height={300}
            muted
            loop
            playsInline
            preload="metadata"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            Your browser does not support the video tag.
          </video>
        </>
      )}
    </div>
  );
};

export default function Services() {
  const servicesArray = Object.values(services)

  return (
    <div>
      {servicesArray.map((service, index) => (
        <ServiceItem
          key={service.id || service.name || index} // Use unique ID if available
          service={service}
          index={index}
        />
      ))}
    </div>
  );
}