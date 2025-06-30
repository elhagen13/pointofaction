'use client'
import GalleryCarousel from "../components/galleryCarousel";
import styles from "./gallery.module.css"
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const [images, setImages] = useState([])

  useEffect(() => {
    const getImages = async () => {
      const response = await fetch("/api/galleryImages", {
        method: "GET",
      });

      const result = await response.json();

      setImages(shuffleArray(result.data))
    }
    getImages()
     
  }, [])

  function shuffleArray(array) {
    // Create a shallow copy to avoid modifying the original array
    const shuffledArray = [...array]; 
  
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      // Generate a random index between 0 and i (inclusive)
      const j = Math.floor(Math.random() * (i + 1));
  
      // Swap elements at indices i and j
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
  
    return shuffledArray;
  }

  const galleryLinks = [
    {
      text: "Embroidery Gallery",
      link: "/gallery/Embroidery",
    },
    {
      text: "Vinyl Gallery",
      link: "/gallery/Vinyl_Printing",

    },
    {
      text: "Laser Etching Gallery",
      link: "/gallery/Laser_Etching",

    },
    {
      text: "Printing Gallery",
      link: "/gallery/Printing",

    },
    {
      text: "Art Digitizing Gallery",
      link: "/gallery/Art_Digitizing",

    },
    {
      text: "Patches Gallery",
      link: "/gallery/Patches",

    },
  ]
  return (
    <div className={styles.galleryPage}>
        <div className={styles.title}>
          Gallery
        </div>
        <div className={styles.galleryReferences}>
          {galleryLinks.map((service, index) => (
            <Link  href={service.link}  
              key={index} className={styles.link}>
              {service.text}
              <div className={styles.arrow}>→</div>
            </Link>
          ))}
        </div>
        <GalleryCarousel images={images}/>
        <div className={styles.photoGrid}>
          {images.map((image, index) => (
            <div key={index}>
              <div className={styles.gridImageParent}>
                <img src={image.imageLink} className={styles.gridImage}/>
              </div>
            {image.company}
            </div>
          ))}

      </div>
       
       
    </div>
  );
}

