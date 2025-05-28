'use client'
import { useRef } from 'react';
import styles from './services.module.css';
import Link from 'next/link';
import services from './services';

export default function Services() {
  // Create separate refs for each video
  const embroideryVideoRef = useRef(null);
  const vinylVideoRef = useRef(null);
  const laserVideoRef = useRef(null);
  const directToFilmVideoRef = useRef(null)

  const handleMouseEnter = (videoRef) => {
    if (videoRef.current) {
      videoRef.current.play().catch(e => console.log("Play failed:", e));
    }
  };

  const handleMouseLeave = (videoRef) => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  return(
    <div>
     {Object.values(services).map((service, index) => (
      <div className={styles.backgroundBlock} key={index}>
        {index % 2 === 0 ? (
          <>
            <img src={service.video} className={styles.photoLeft} alt={service.name} />
            <div className={`${styles.textBlock} ${styles.textBlockRight}`}>
              <h2 className={styles.serviceText}>{service.name}</h2>
              <Link href={service.link} className={styles.learnMore}>LEARN MORE</Link>
            </div>
          </>
        ) : (
          <>
            <div className={`${styles.textBlock} ${styles.textBlockLeft}`}>
              <h2 className={styles.serviceText}>{service.name}</h2>
              <Link href={service.link} className={styles.learnMore}>LEARN MORE</Link>
            </div>
            <img src={service.video} className={styles.photoRight} alt={service.name} />
          </>
        )}
      </div>
    ))}      
    </div>
  )

  /*
  return (
    <div style={{backgroundColor: "#365266", color: "white"}}>
      <div 
        className={styles.service}
        onMouseEnter={() => handleMouseEnter(embroideryVideoRef)}
        onMouseLeave={() => handleMouseLeave(embroideryVideoRef)}
      >
        <div className={`${styles.videoContainer} ${styles.left}`}>
          <img
            src="/services/embroidery.mp4"
            className={styles.croppedVideo}
          >
          </img>
        </div>
        <div className={`${styles.textContainer} ${styles.right}`}>
            Embroidery
            <div style={{position: "relative"}}>
              <Link className={styles.textLink} href="/services/embroidery">Learn More</Link>
            </div>        
        </div>
      </div>

      <div 
        className={styles.service}
        onMouseEnter={() => handleMouseEnter(vinylVideoRef)}
        onMouseLeave={() => handleMouseLeave(vinylVideoRef)}
      >
        <div className={`${styles.videoContainer} ${styles.right}`}>
          <video
            ref={vinylVideoRef}
            muted
            loop
            playsInline
            className={styles.video}
          >
            <source src="/services/vinyl.mp4" type="video/mp4" />
          </video>
        </div>
        <div className={`${styles.textContainer} ${styles.left}`}>
            Vinyl Printing & Cutting
            <div style={{position: "relative"}}>
              <Link className={styles.textLink} href="/services/vinyl">Learn More</Link>
            </div>        
        </div>
      </div>
      <div 
        className={styles.service}
        onMouseEnter={() => handleMouseEnter(laserVideoRef)}
        onMouseLeave={() => handleMouseLeave(laserVideoRef)}
      >
        <div className={`${styles.videoContainer} ${styles.left}`}>
          <video
            ref={laserVideoRef}
            muted
            loop
            playsInline
            className={styles.video}
          >
            <source src="/services/laser.mp4" type="video/mp4" />
          </video>
        </div>
        <div className={`${styles.textContainer} ${styles.right}`}>
            Laser Etching
            <div style={{position: "relative"}}>
              <Link className={styles.textLink} href="/services/laser">Learn More</Link>
            </div>
        </div>
      </div>
      <div 
        className={styles.service}
        onMouseEnter={() => handleMouseEnter(directToFilmVideoRef)}
        onMouseLeave={() => handleMouseLeave(directToFilmVideoRef)}
      >
        <div className={`${styles.videoContainer} ${styles.right}`}>
          <video
            ref={directToFilmVideoRef}
            muted
            loop
            playsInline
            className={styles.video}
          >
            <source src="/services/film.mp4" type="video/mp4" />
          </video>
        </div>
        <div className={`${styles.textContainer} ${styles.left}`}>
            Direct to Film
            <div style={{position: "relative"}}>
              <Link className={styles.textLink} href="/services/film">Learn More</Link>
            </div>
        </div>
      </div>
    </div>
  );*/
}