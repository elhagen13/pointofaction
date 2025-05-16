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
                <Link key={index} href={vendor.link} target="_blank">
                    <div className={styles.imageContainer}>
                        <img src={vendor.image} className={styles.image}/>
                    </div>
                    {vendor.storeName}
                </Link>
            ))
        }
        </div>
        <div className={styles.title}>
            Tops
        </div>
        <div className={styles.vendorList}>
            {
                tops.map((vendor, index) => (
                    <Link key={index} href={vendor.link} target="_blank">
                        <div className={styles.imageContainer}>
                            <img src={vendor.image} className={styles.image}/>
                        </div>
                        {vendor.storeName}
                    </Link>
                ))
            }
        </div>
        <div className={styles.title}>
            Outerwear
        </div>
        <div className={styles.vendorList}>
            {
                outerwear.map((vendor, index) => (
                    <Link key={index} href={vendor.link} target="_blank">
                        <div className={styles.imageContainer}>
                            <img src={vendor.image} className={styles.image}/>
                        </div>
                        {vendor.storeName}
                    </Link>
                ))
            }
        </div>
        <div className={styles.title}>
            Headwear
        </div>
        <div className={styles.vendorList}>
            {
                headwear.map((vendor, index) => (
                    <Link key={index} href={vendor.link} target="_blank">
                        <div className={styles.imageContainer}>
                            <img src={vendor.image} className={styles.image}/>
                        </div>
                        {vendor.storeName}
                    </Link>
                ))
            }
        </div>
        <div className={styles.title}>
            Activewear
        </div>
        <div className={styles.vendorList}>
            {
                activewear.map((vendor, index) => (
                    <Link key={index} href={vendor.link} target="_blank">
                        <div className={styles.imageContainer}>
                            <img src={vendor.image} className={styles.image}/>
                        </div>
                        {vendor.storeName}
                    </Link>
                ))
            }
        </div>
        <div className={styles.title}>
            Workwear
        </div>
        <div className={styles.vendorList}>
            {
                workwear.map((vendor, index) => (
                    <Link key={index} href={vendor.link} target="_blank">
                        <div className={styles.imageContainer}>
                            <img src={vendor.image} className={styles.image}/>
                        </div>
                        {vendor.storeName}
                    </Link>
                ))
            }
        </div>
        <div className={styles.title}>
            Drinkware
        </div>
        <div className={styles.vendorList}>
            {
                drinkware.map((vendor, index) => (
                    <Link key={index} href={vendor.link} target="_blank">
                        <div className={styles.imageContainer}>
                            <img src={vendor.image} className={styles.image}/>
                        </div>
                        {vendor.storeName}
                    </Link>
                ))
            }
        </div>

    </div>
  );
}

