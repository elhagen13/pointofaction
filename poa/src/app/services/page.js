'use client'
import { useRef } from 'react';
import styles from './services.module.css';
import Link from 'next/link';
import services from './services';

export default function Services() {

  return(
    <div>
     {Object.values(services).map((service, index) => (
      <div className={styles.backgroundBlock} key={index}>
        {index % 2 === 0 ? (
          <>
            <img src={service.video} className={styles.photoLeft} alt={service.name} />
            <div className={`${styles.textBlock} ${styles.textBlockRight}`}>
              <h2 className={styles.serviceText}>{service.name}</h2>
              <Link href={service.link} className={styles.learnMore}>LEARN MORE</Link>
            </div>
          </>
        ) : (
          <>
            <div className={`${styles.textBlock} ${styles.textBlockLeft}`}>
              <h2 className={styles.serviceText}>{service.name}</h2>
              <Link href={service.link} className={styles.learnMore}>LEARN MORE</Link>
            </div>
            <img src={service.video} className={styles.photoRight} alt={service.name} />
          </>
        )}
      </div>
    ))}      
    </div>
  )
 }