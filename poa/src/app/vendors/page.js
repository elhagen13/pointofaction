'use client'
import { useState, useEffect } from 'react';
import {vendors, categories} from './vendors.js'
import styles from './vendors.module.css'
import Link from 'next/link.js';

export default function Vendors(){
    const [overall, setOverall] = useState([]);
    const [tops, setTops] = useState([]);
    const [outerwear, setOuterwear] = useState([]);
    const [activewear, setActivewear] = useState([]);
    const [headwear, setHeadwear] = useState([]);
    const [workwear, setWorkwear] = useState([]);
    const [drinkware, setDrinkwear] = useState([]);

    const [overlay, setOverlay] = useState(false);
    const [overlayLink, setOverlayLink] = useState('')

    const vendorClick = (link) => {
        console.log(link)
        setOverlayLink(link)
        setOverlay(true)

        return;
    }

    const overlayOff = () => {
        setOverlayLink('');
        setOverlay(false);

        return;
    }

    
    useEffect(() => {
        setOverall(categories.overall.map(vendor => vendors[vendor]));
        setTops(categories.tops.map(vendor => vendors[vendor]));
        setOuterwear(categories.outerwear.map(vendor => vendors[vendor]));
        setActivewear(categories.activewear.map(vendor => vendors[vendor]));
        setHeadwear(categories.headwear.map(vendor => vendors[vendor]));
        setWorkwear(categories.workwear.map(vendor => vendors[vendor]));
        setDrinkwear(categories.drinkware.map(vendor => vendors[vendor]));

    }, [])

    return (
    <div className={styles.vendorPage}>
        <div className={styles.descriptionContainer}>
            <div className={styles.description}>
                <div className={styles.header}>
                    Our Vendors
                </div>
                We purchase your base garments for you, utilizing our distributor deals on bulk 
                orders. Below is just a sample of the vendors we support. Feel free to browse their catalogs 
                for a garment you would like to customize!
            </div>
        </div>
        <div className={styles.title}>
            All Apparel
        </div>
        <div className={styles.vendorList}>
        {
            overall.map((vendor, index) => (
                <>
                {
                    !vendor.blocked ? 
                    <div onClick={() => vendorClick(vendor.link)}>
                        <div className={styles.imageContainer}>
                            <img src={vendor.image} className={styles.image}/>
                        </div>
                        {vendor.storeName}
                    </div>
                    :
                    <Link key={index} href={vendor.link} target="_blank">
                        <div className={styles.imageContainer}>
                            <img src={vendor.image} className={styles.image}/>
                        </div>
                        {vendor.storeName}
                    </Link>
                }               
                </>
            )
            )
        }
        </div>
        <div className={styles.title}>
            Tops
        </div>
        <div className={styles.vendorList}>
            {
                tops.map((vendor, index) => (
                    <>
                        {
                            !vendor.blocked ? 
                            <div onClick={() => vendorClick(vendor.link)}>
                                <div className={styles.imageContainer}>
                                    <img src={vendor.image} className={styles.image}/>
                                </div>
                                {vendor.storeName}
                            </div>
                            :
                            <Link key={index} href={vendor.link} target="_blank">
                                <div className={styles.imageContainer}>
                                    <img src={vendor.image} className={styles.image}/>
                                </div>
                                {vendor.storeName}
                            </Link>
                        }               
                    </>
                ))
            }
        </div>
        <div className={styles.title}>
            Outerwear
        </div>
        <div className={styles.vendorList}>
            {
                outerwear.map((vendor, index) => (
                <>
                    {
                        !vendor.blocked ? 
                        <div onClick={() => vendorClick(vendor.link)}>
                            <div className={styles.imageContainer}>
                                <img src={vendor.image} className={styles.image}/>
                            </div>
                            {vendor.storeName}
                        </div>
                        :
                        <Link key={index} href={vendor.link} target="_blank">
                            <div className={styles.imageContainer}>
                                <img src={vendor.image} className={styles.image}/>
                            </div>
                            {vendor.storeName}
                        </Link>
                    }               
                </>
                ))
            }
        </div>
        <div className={styles.title}>
            Headwear
        </div>
        <div className={styles.vendorList}>
            {
                headwear.map((vendor, index) => (
                    <>
                    {
                        !vendor.blocked ? 
                        <div onClick={() => vendorClick(vendor.link)}>
                            <div className={styles.imageContainer}>
                                <img src={vendor.image} className={styles.image}/>
                            </div>
                            {vendor.storeName}
                        </div>
                        :
                        <Link key={index} href={vendor.link} target="_blank">
                            <div className={styles.imageContainer}>
                                <img src={vendor.image} className={styles.image}/>
                            </div>
                            {vendor.storeName}
                        </Link>
                    }               
                    </>
                ))
            }
        </div>
        <div className={styles.title}>
            Activewear
        </div>
        <div className={styles.vendorList}>
            {
                activewear.map((vendor, index) => (
                    <>
                    {
                        !vendor.blocked ? 
                        <div onClick={() => vendorClick(vendor.link)}>
                            <div className={styles.imageContainer}>
                                <img src={vendor.image} className={styles.image}/>
                            </div>
                            {vendor.storeName}
                        </div>
                        :
                        <Link key={index} href={vendor.link} target="_blank">
                            <div className={styles.imageContainer}>
                                <img src={vendor.image} className={styles.image}/>
                            </div>
                            {vendor.storeName}
                        </Link>
                    }               
                    </>
                ))
            }
        </div>
        <div className={styles.title}>
            Workwear
        </div>
        <div className={styles.vendorList}>
            {
                workwear.map((vendor, index) => (
                    <>
                    {
                        !vendor.blocked ? 
                        <div onClick={() => vendorClick(vendor.link)}>
                            <div className={styles.imageContainer}>
                                <img src={vendor.image} className={styles.image}/>
                            </div>
                            {vendor.storeName}
                        </div>
                        :
                        <Link key={index} href={vendor.link} target="_blank">
                            <div className={styles.imageContainer}>
                                <img src={vendor.image} className={styles.image}/>
                            </div>
                            {vendor.storeName}
                        </Link>
                    }               
                    </>
                ))
            }
        </div>
        <div className={styles.title}>
            Drinkware
        </div>
        <div className={styles.vendorList}>
            {
                drinkware.map((vendor, index) => (
                    <>
                        {
                            !vendor.blocked ? 
                            <div onClick={() => vendorClick(vendor.link)}>
                                <div className={styles.imageContainer}>
                                    <img src={vendor.image} className={styles.image}/>
                                </div>
                                {vendor.storeName}
                            </div>
                            :
                            <Link key={index} href={vendor.link} target="_blank">
                                <div className={styles.imageContainer}>
                                    <img src={vendor.image} className={styles.image}/>
                                </div>
                                {vendor.storeName}
                            </Link>
                        }               
                    </>
                ))
            }
        </div>
        {overlay && 
        <div className={styles.frameOverlay}>
            <button 
                className={styles.closeButton} 
                onClick={overlayOff}
                aria-label="Close overlay"
                >
                <div style={{transform: "translateY(-2px)"}}>
                    ×
                </div>
            </button>
            <iframe 
                src={overlayLink} 
                title="Vendor website"
                allowFullScreen
            />
        </div>
        }

    </div>
  );
}

