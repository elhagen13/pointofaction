"use client";
import GalleryCarousel from "../components/galleryCarousel";
import Carousel from "../components/carousels/Carousel";
import styles from "./gallery.module.css";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const [images, setImages] = useState([]);
  const [value, setValue] = useState(5);
  const [companyView, setCompanyView] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [maxColumns, setMaxColumns] = useState(20);
  const [mobile, setMobile] = useState(false)

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/tracker', {
      method: "POST",
      body: JSON.stringify({
          page:'gallery'
      })
    })
  }, [])

  
  useEffect(() => {
  const updateMax = () => {
    if (window.innerWidth <= 768) {
      setMaxColumns(8);
      if (value > 8) setValue(8); 
    } else {
      setMaxColumns(20);
    }
  };

  updateMax();
  window.addEventListener("resize", updateMax);
  return () => window.removeEventListener("resize", updateMax);
}, [value]);

  useEffect(() => {
    setLoading(true)
    const getImages = async () => {
      const response = await fetch("/api/galleryImages", {
        method: "GET",
      });

      const result = await response.json();
      setCompanies(result.data);
      console.log(result.data);
      console.log(result.data.map((company) => company.items).flat());
      setImages(
        shuffleArray(result.data.map((company) => company.items).flat())
      );
      setLoading(false)
    };
    getImages();
  }, []);

  function shuffleArray(array) {
    // Create a shallow copy to avoid modifying the original array
    if (!array) return [];

    const shuffledArray = [...array];

    for (let i = shuffledArray.length - 1; i > 0; i--) {
      // Generate a random index between 0 and i (inclusive)
      const j = Math.floor(Math.random() * (i + 1));

      // Swap elements at indices i and j
      [shuffledArray[i], shuffledArray[j]] = [
        shuffledArray[j],
        shuffledArray[i],
      ];
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
  ];

  const changeHovered = (index) => {
    if((index + 1) % value !== 0){
      setHovered(index)
    }
    else{
      let modifiedCompanies = companies
      const valAtIndex = modifiedCompanies[index]
      modifiedCompanies[index] = modifiedCompanies[index - 1];
      modifiedCompanies[index - 1] = valAtIndex
      setCompanies(modifiedCompanies)
      setHovered(index - 1)
    }
  }
  return (
    <div className={styles.galleryPage}>
      <div className={styles.title}>Gallery</div>
      <div className={styles.galleryReferences}>
        {galleryLinks.map((service, index) => (
          <Link href={service.link} key={index} className={styles.link}>
            {service.text}
            <div className={styles.arrow}>→</div>
          </Link>
        ))}
      </div>
      <Carousel images={images} loading={loading}/>
      <div className={styles.spaceApart}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          Company View
          <div
            className={styles.toggle}
            onClick={() => setCompanyView(!companyView)}
            style={{ backgroundColor: companyView ? "#414a81" : "#deddddff" }}
          >
            <div
              className={`${styles.toggleSwitch} ${companyView ? styles.toggleSwitchOn : styles.toggleSwitchOff}`}
            />
          </div>
        </div>
        <div className={styles.slider}>
          Columns:
          <div>
            <input
              id="slider"
              type="range"
              min="4"
              max={maxColumns}
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              style={{ width: "100%", margin: "10px 0" }}
            />
          </div>
        </div>
      </div>
      {!companyView ? (
        <div
          className={styles.photoGrid}
          style={{ gridTemplateColumns: `repeat(${value}, 1fr)` }}
        >
          {images.map((image, index) => (
            <div key={index}>
              <div className={styles.gridImageParent}>
                <img src={image.image} className={styles.gridImage} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className={styles.photoGrid}
          style={{ gridTemplateColumns: `repeat(${value}, 1fr)` }}
        >
          {companies.map(
            (company, index) =>
              company.image && (
                <div
                  key={index}
                  className={`${styles.companyTile} ${
                    hovered === index ? styles.expanded : ""
                  }`}
                  onMouseEnter={() => changeHovered(index)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <img src={company.image} className={styles.companyImage} />

                  <div className={styles.itemsGrid}>
                    <div className={styles.flexGrid}>
                      {company.items.slice(0, Math.round(company.items.length / 2)).map((item, i) => (
                        <img key={i} src={item.image} />
                      ))}
                    </div>
                    <div className={styles.flexGrid}>
                      {company.items.slice(Math.round(company.items.length / 2)).map((item, i) => (
                        <img key={i} src={item.image} />
                      ))}
                    </div>
                  </div>
                </div>
              )
          )}
        </div>
      )}
    </div>
  );
}
