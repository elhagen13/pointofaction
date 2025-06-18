'use client'
import { useState } from 'react';
import Link from 'next/link';
import styles from './customerCarousel.module.css';
import { MdArrowOutward } from "react-icons/md";


const CustomerCarousel = () => {
  const customer_reviews = [
    "/sample_works/calfruit.jpg",
    "/sample_works/freedomequitygroup.jpg",
    "/sample_works/hat.jpg",
    "/sample_works/nutrien-hat.jpg",
    "/sample_works/machado.jpg",
    "/sample_works/onageroptek.jpg",
    "/sample_works/peakingproduce.jpg",
    "/sample_works/premier.jpg",
    "/sample_works/reiterberryfarms.jpg",
    "/sample_works/s.jpg",
    "/sample_works/sdf.jpg",
    "/sample_works/sms.jpg",
    "/sample_works/image12.jpeg",
    "/sample_works/image13.jpeg",
    "/sample_works/image14.jpeg",
  ]

  return (
    <div className={styles.customerCarousel}>
      {customer_reviews.map((sample, index) => (
        <div 
          key={index} 
          className={styles.customerImageContainer}
        >          <img 
            src={sample} 
            alt={`Customer review ${index + 1}`}
            className={styles.customerImage}
          />
          <div></div>
        </div>
      ))}
        <div className={styles.transparencyLayer1}/>
        <div className={styles.transparencyLayer2}/>

    </div>
  );
};

export default CustomerCarousel;