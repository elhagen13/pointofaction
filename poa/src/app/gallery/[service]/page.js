'use client'
import { use } from 'react'; 
import GalleryCarousel from '../../components/galleryCarousel'
import styles from "../gallery.module.css"
import Link from 'next/link';
import {useState, useEffect} from 'react'

export default function TargetPage({ params }) {
  const [images, setImages] = useState([])
  const { service } = use(params); 
  const serviceRefined = service.replace("_", " ")  
  
  useEffect(() => {
    const getImages = async () => {
      const response = await fetch("/api/galleryImages", {
        method: "GET",
      });

      const result = await response.json();

      setImages(result.data)
    }
    getImages()
     
  }, [])

  const filteredImages = images.filter(image => image.type === serviceRefined)

  return (
    <div className={styles.galleryPage}>
      <div className={styles.breadcrumbs}>
        <Link href="/gallery">
            <div className={styles.breadcrumb}>Gallery</div>
        </Link>
        &gt;
        <div>
        {serviceRefined.split(/(?=[A-Z])/).join(" ")} Gallery
        </div>
      </div>
      <h1 className={styles.title}>{serviceRefined.split(/(?=[A-Z])/).join(" ")} Gallery</h1>
      <GalleryCarousel images={filteredImages}/>
      <div className={styles.photoGrid}>
        {filteredImages.map((image, index) => (
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