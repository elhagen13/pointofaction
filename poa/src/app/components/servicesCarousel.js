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
        link: "/service/embroidery"
    },
    {
        service: "Vinyl Printing",
        image: "/service_vinylprinting.png",
        link: "/service/vinyl_printing"
    },
    {
        service: "Laser Etching",
        image: "/service_laseretching.png",
        link: "/service/laser_etching"
    },
    {
        service: "Direct to Film",
        image: "/service_directtofilm.png",
        link: "/service/direct_to_film"
    },
    {
        service: "Art Digitizing",
        image: "/service_artdigitizing.png",
        link: "/service/art_digitizing"
    },

  ]


  return (
    <div className={styles.carouselContainer} >
        <div className={styles.group}>
        {
            services.map((service, index) => 
                <div key={index} className={styles.serviceCard}>
                    <img src={service.image} className={styles.serviceCardImage}/>
                    <div className={styles.hoveredCard}>
                        <div className={styles.textContainer}>
                            <div className={styles.text}>
                                {service.service}
                            </div>                                
                            <Link href={service.link}>
                                <MdArrowOutward className={styles.arrow} />
                            </Link>                        
                        </div>
                    </div>
                </div>
            )
        }
        </div>
        <div aria-hidden className={styles.group}>
        {
            services.map((service, index) => 
                <div key={index} className={styles.serviceCard}>
                    <img src={service.image} className={styles.serviceCardImage}/>
                    <div className={styles.hoveredCard}>
                        <div className={styles.textContainer}>
                            <div className={styles.text}>
                                {service.service}
                            </div>
                            <Link href={service.link}>
                                <MdArrowOutward className={styles.arrow} />
                            </Link>
                            </div>
                    </div>
                </div>
            )
        }
        </div>
        <div aria-hidden className={styles.group}>
        {
            services.map((service, index) => 
                <div key={index} className={styles.serviceCard}>
                    <img src={service.image} className={styles.serviceCardImage}/>
                    <div className={styles.hoveredCard}>
                        <div className={styles.textContainer}>
                            <div className={styles.text}>
                                {service.service}
                            </div>
                            <Link href={service.link}>
                                <MdArrowOutward className={styles.arrow} />
                            </Link>
                        </div>
                    </div>
                </div>
            )
        }
        </div>


    </div>
  );
};

export default ServicesCarousel;