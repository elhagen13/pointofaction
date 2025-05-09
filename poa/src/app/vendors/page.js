'use client'
import { useState, useEffect } from 'react';
import {vendors, categories} from './vendors.js'
import styles from './vendors.module.css'

export default function Vendors(){
    const [tops, setTops] = useState([]);
    const [outerwear, setOuterwear] = useState([]);
    const [activewear, setActivewear] = useState([]);
    const [headwear, setHeadwear] = useState([]);
    const [workware, setWorkwear] = useState([]);
    const [drinkware, setDrinkwear] = useState([]);

    
    useEffect(() => {
        setTops(categories.tops.map(vendor => vendors[vendor]));
        setOuterwear(categories.outerwear.map(vendor => vendors[vendor]));
        setActivewear(categories.activewear.map(vendor => vendors[vendor]));
        setHeadwear(categories.headwear.map(vendor => vendors[vendor]));
        setWorkwear(categories.workwear.map(vendor => vendors[vendor]));
        setDrinkwear(categories.drinkware.map(vendor => vendors[vendor]));

    }, [])

    return (
    <div>
        <div className={styles.title}>
            All Apparel
        </div>
        <div className={styles.vendorList}>

        </div>
        <div className={styles.title}>
            Tops
        </div>
        <div className={styles.vendorList}>
            {
                tops.map((top) => {
                    <div className={styles.imageContainer}>
                        <img src={top.image}/>
                    </div>
                })
            }
        </div>

    </div>
  );
}

