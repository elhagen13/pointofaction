'use client'
import { useState } from 'react';
import Link from 'next/link';
import styles from './customerCarousel.module.css';
import { MdArrowOutward } from "react-icons/md";


const CustomerCarousel = () => {
  const customer_reviews = [
    "/sample_works/gofwest.jpg",
    "/sample_works/calfruit.jpg",
    "/sample_works/freedomequitygroup.jpg",
    "/sample_works/nutrien-hat.jpg",
    "/sample_works/machado.jpg",
    "/sample_works/onageroptek.jpg",
    "/sample_works/smhs.jpg",
    "/sample_works/premier.jpg",
    "/sample_works/reiterberryfarms.jpg",
    "/sample_works/smpc.jpg",
    "/sample_works/lompoc.jpg",
    "/sample_works/sms.jpg",
    "/sample_works/fredsautomotive.jpg",
    "/sample_works/hat.jpg",
    "/sample_works/s.jpg",
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