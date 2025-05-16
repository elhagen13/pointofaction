'use client'
import { use } from 'react'; 
import Link from 'next/link';
import services from '../services.js';
import styles from './service.module.css'


export default function Service({params}) {
    const { service } = use(params); 
    const serviceInfo = services[service]

    return (
        <div className={styles.servicePage}>
            <img src={serviceInfo.image} className={styles.serviceImage}/>
            <div className={styles.info}>
                <div className={styles.breadcrumbs}>
                    <Link href="/services">
                        <div className={styles.breadcrumb}>Gallery</div>
                    </Link>
                     &gt;
                    <div>
                        {serviceInfo.name}
                    </div>
                </div>
                <div className={styles.title}>
                    {serviceInfo.name}
                </div>
                <div>
                    {serviceInfo.description}
                </div>
                <div className={styles.abilityBox}>
                    <div className={styles.capabilityTitle}>
                        Capabilities
                    </div>
                    {
                        serviceInfo.capabilities.map((capability, index) => (
                          <div key={index} className={styles.capability}>
                            <div style={{fontSize: "30px"}}>&#9745;</div>
                            {capability}
                          </div>
                        ))
                    }
                </div>   
                <Link href="/gallery">
                    <div className={styles.button}>Go to Gallery &#10142;</div>
                </Link>
            </div>
        </div>
    );
}
