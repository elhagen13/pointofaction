import { use } from 'react'; 
import images from '../images';
import GalleryCarousel from '../../components/galleryCarousel'
import styles from "../gallery.module.css"
import Link from 'next/link';

export default function TargetPage({ params }) {
  const { service } = use(params); 
  const filteredImages = images.filter(image => image.type === service)
  
  return (
    <div className={styles.galleryPage}>
      <div className={styles.breadcrumbs}>
        <Link href="/gallery">
            <div className={styles.breadcrumb}>Gallery</div>
        </Link>
        &gt;
        <div>
        {service.split(/(?=[A-Z])/).join(" ")} Gallery
        </div>
      </div>
      <h1 className={styles.title}>{service.split(/(?=[A-Z])/).join(" ")} Gallery</h1>
      <GalleryCarousel images={filteredImages}/>
      <div className={styles.photoGrid}>
        {filteredImages.map((image, index) => (
          <div key={index}>
          <div className={styles.gridImageParent}>
            <img src={image.link} className={styles.gridImage}/>
          </div>
          {image.company}
          </div>
        ))}

      </div>

    </div>
  );
}