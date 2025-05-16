
import GalleryCarousel from "../components/galleryCarousel";
import styles from "./gallery.module.css"
import Link from "next/link";
import images from "./images"

export default function Home() {

  const galleryLinks = [
    {
      text: "Embroidery Gallery",
      link: "/gallery/Embroidery",
    },
    {
      text: "Vinyl Gallery",
      link: "/gallery/Vinyl",

    },
    {
      text: "Laser Etching Gallery",
      link: "/gallery/LaserEtching",

    },
    {
      text: "Direct to Film Gallery",
      link: "/gallery/DirectToFilm",

    },
    {
      text: "Art Digitizing Gallery",
      link: "/gallery/ArtDigitizing",

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
       
       
    </div>
  );
}

