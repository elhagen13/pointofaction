'use client'
import { useRef, useMemo, useCallback } from 'react';
import styles from './services.module.css';
import Link from 'next/link';
import services from './services';

// Memoized service item component to prevent unnecessary re-renders
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
            loading={index < 2 ? 'eager' : 'lazy'} // Lazy load images below fold
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
            width={500} // Add appropriate dimensions
            height={300}
            priority={index < 2} // Prioritize first 2 images
            loading={index < 2 ? 'eager' : 'lazy'} // Lazy load images below fold
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyLDd5F8xxqUyHRGcwHKs3nHNW5w+tg="
          />
        </>
      )}
    </div>
  );
};

export default function Services() {
  // Memoize the services array to prevent recalculation on every render
  const servicesArray = useMemo(() => Object.values(services), []);

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