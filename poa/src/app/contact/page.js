"use client";
import { useEffect, useRef, useState } from 'react';
import styles from "./contact.module.css";
import Link from 'next/link';
import employees from './employees';

export default function LeafletMap() {
  const mapRef = useRef(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapRef.current) return;

    const loadMap = async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      const map = L.map(mapRef.current).setView([34.919091, -120.442226], 15);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      L.marker([34.919091, -120.442226]).addTo(map);

      return () => {
        map.remove();
      };
    };

    loadMap();
  }, [isClient]);

  return (
    <div>
      {isClient ? (
        <div ref={mapRef} style={{ height: '300px', width: '100%' }} />
      ) : (
        <div style={{ height: '300px', width: '100%', backgroundColor: '#eee' }}>
          Loading map...
        </div>
      )}
      <div>
      <div className={styles.contactUs}>
      <div className={styles.contactInfo}>
        <div className={styles.title}>Contact Us</div>
        <div>
          <div className={styles.bold}>Interested in Ordering?</div>
          Follow this <Link href="/howToOrder">tutorial</Link> to place an order at the online store.
        </div>
        <div>
          <div className={styles.bold}>Need further assistance?<br/>Get in touch!</div>
          1 (805) 922 - 6253
          <br/><br/>
          orders@pointofaction.com
          <br/><br/>
          2232 South Depot Street
          <br/><br/>
          Santa Maria, CA 93455
        </div>
      </div>
      <img style={{width: "50%", objectFit: "cover"}} className={styles.storeImage} src="/about_us/store.png"/>
    </div>
    <div style={{padding: "30px 60px"}}>
      <div style={{fontWeight: "bold" ,fontSize: "32px", marginBottom: "20px"}}>Meet Our Team!</div>
        <div className={styles.employees}>
          {
            employees.map((employee, index) => (
              <div key={index} className={styles.employeeContainer}>
                <div className={styles.imageContainer}>
                  <img src={employee.photo} className={styles.image}/>
                </div>
                <div style={{fontWeight: "bold", fontSize: "20px"}}>{employee.name}</div>
                <div style={{fontWeight: "600"}}>{employee.role}</div>
                <div>{employee.email}    •    {employee.number}</div>
              </div>
            ))
          }

        </div>
      </div>
    </div>
    </div>
  );
}