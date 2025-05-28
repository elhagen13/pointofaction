'use client'
import { useState } from 'react';
import Link from 'next/link';
import styles from './servicesCarousel.module.css';
import { MdArrowOutward } from "react-icons/md";


const ServicesCarousel = () => {
  const services = [
    {
        service: "Embroidery",
        image: "/service_embroidery.png",
        link: "/services/embroidery"
    },
    {
        service: "Vinyl Printing",
        image: "/service_vinylprinting.png",
        link: "/services/vinyl"
    },
    {
        service: "Laser Etching",
        image: "/service_laseretching.png",
        link: "/services/laser"
    },
    {
        service: "Direct to Film",
        image: "/service_directtofilm.png",
        link: "/services/film"
    },
    {
        service: "Art Digitizing",
        image: "/service_artdigitizing.png",
        link: "/services/digitizing"
    },

  ]


  return (
    <div className={styles.carouselContainer} >
        <div className={styles.group}>
        {
            services.map((service, index) => 
                <Link href={service.link} key={index} className={styles.serviceCard}>
                    <img src={service.image} className={styles.serviceCardImage}/>
                    <div className={styles.hoveredCard}>
                        <div className={styles.textContainer}>
                            <div className={styles.text}>
                                {service.service}
                            </div>                                
                            <MdArrowOutward className={styles.arrow} />
                        </div>
                    </div>
                </Link>
            )
        }
        </div>
        <div aria-hidden className={styles.group}>
        {
            services.map((service, index) => 
                <Link href={service.link} key={index} className={styles.serviceCard}>
                    <img src={service.image} className={styles.serviceCardImage}/>
                    <div className={styles.hoveredCard}>
                        <div className={styles.textContainer}>
                            <div className={styles.text}>
                                {service.service}
                            </div>
                            <MdArrowOutward className={styles.arrow} />
                            </div>
                    </div>
                </Link>
            )
        }
        </div>
        <div aria-hidden className={styles.group}>
        {
            services.map((service, index) => 
                <Link href={service.link} key={index} className={styles.serviceCard}>
                    <img src={service.image} className={styles.serviceCardImage}/>
                    <div className={styles.hoveredCard}>
                        <div className={styles.textContainer}>
                            <div className={styles.text}>
                                {service.service}
                            </div>
                            <MdArrowOutward className={styles.arrow} />
                        </div>
                    </div>
                </Link>
            )
        }
        </div>


    </div>
  );
};

export default ServicesCarousel;