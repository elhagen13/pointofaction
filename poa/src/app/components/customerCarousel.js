'use client'
import { useState } from 'react';
import Link from 'next/link';
import styles from './customerCarousel.module.css';
import { MdArrowOutward } from "react-icons/md";


const CustomerCarousel = () => {
  const customer_reviews = [
    "/sample_works/image1.jpeg",
    "/sample_works/image2.jpeg",
    "/sample_works/image3.jpeg",
    "/sample_works/image4.jpeg",
    "/sample_works/image5.jpeg",
    "/sample_works/image6.jpeg",
    "/sample_works/image7.jpeg",
    "/sample_works/image8.jpeg",
    "/sample_works/image9.jpeg",
    "/sample_works/image10.jpeg",
    "/sample_works/image11.jpeg",
    "/sample_works/image12.jpeg",
    "/sample_works/image13.jpeg",
    "/sample_works/image14.jpeg",
    "/sample_works/image15.jpeg",
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