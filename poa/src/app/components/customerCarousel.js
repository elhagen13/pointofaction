'use client'
import { useState } from 'react';
import Link from 'next/link';
import styles from './customerCarousel.module.css';
import { MdArrowOutward } from "react-icons/md";


const CustomerCarousel = () => {
  const customer_reviews = [
    "/sample_works/image1.png",
    "/sample_works/image2.png",
    "/sample_works/image3.png",
    "/sample_works/image4.png",
    "/sample_works/image5.png",
    "/sample_works/image6.png",
    "/sample_works/image7.png",
    "/sample_works/image8.png",
    "/sample_works/image9.png",
    "/sample_works/image10.png",
    "/sample_works/image11.png",
    "/sample_works/image12.png",
    "/sample_works/image13.png",
    "/sample_works/image14.png",
    "/sample_works/image15.png",
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