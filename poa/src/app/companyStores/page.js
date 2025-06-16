"use client"

import { useEffect, useState } from "react";
import styles from "./companyStores.module.css"
import { IoSearch } from "react-icons/io5";
import { IoWarningOutline } from "react-icons/io5";
import Link from "next/link";

export default function companyStores() {
    const [search, setSearch] = useState("")
    const [result, setResult] = useState([])
    const [stores, setCompanies] = useState([])
    const [publicCompanies, setPublicCompanies] = useState([])


    const [isSmall, setIsSmall] = useState(false)

    useEffect(() => {
        // Set initial value and add resize listener only on client side
        const handleResize = () => setIsSmall(window.innerWidth < 769);
        
        // Set initial value
        handleResize();
        
        // Add event listener
        window.addEventListener("resize", handleResize);
        
        // Cleanup function
        return () => window.removeEventListener("resize", handleResize);
    }, []);


    useEffect(() => {
        getAllCompanies()
    }, [])

    async function getAllCompanies() {
        try {
          const response = await fetch("/api/companyStores");
          const data = await response.json();
    
          if (data.success) {
            console.log("Companies:", data.data);
            console.log("Total companies:", data.pagination.total);
            setCompanies(data.data);
            setPublicCompanies(data.data.filter(d => !d.private))
          } else {
            console.error("Error:", data.error);
          }
        } catch (error) {
          console.error("Fetch error:", error);
        }
      }

    function lookup(array, searchTerm) {
        if (!searchTerm || !searchTerm.trim()) return [];
      
        const searchWords = searchTerm.trim().toLowerCase().split(/\s+/);
        
        const result = array.filter(item => {
            const itemWords = item.companyName.toLowerCase().split(/\s+/);
            
            return searchWords.every(searchWord => 
              itemWords.some(itemWord => itemWord === searchWord)
            );
        })
        
        result.length == 0 ? setResult([null]) : setResult(result)
        
        return;
    }
    
    const handleSearch = (event) => {
        setSearch(event.target.value);
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            lookup(stores, search);
        }
    };

    useEffect(() => {}, [result])

    return (
        <div className={styles.storeSearch} >
            <div className={styles.header}>
                Store Search
                <div className={styles.searchContainer}>
                    <input 
                        className={styles.searchBar} 
                        placeholder="Search"
                        onChange={handleSearch} 
                        onKeyDown={handleKeyDown}
                        value={search}
                    />
                    <IoSearch 
                        className={styles.searchIcon} 
                        onClick={() => lookup(stores, search)}
                    />
                </div>
            </div>
            {
                search.length == 0 ? 
                <>
                    <div className={styles.directions}>
                        {!isSmall ? <IoWarningOutline size={50} color="white"/> : <></>}
                        <div>
                            A company store is a store that has been pre-populated with a customers previous orders for the ease of placing a repeat order. If you do not have an existing store with us, and are instead looking to place a new customized order, visit our online store <Link href="https://dpipcoincdbapointofaction.shops.shopvox.com" style={{color: "#4F71B5", textDecoration:"underline"}}>here.</Link>
                        </div>
                    </div>
                    {publicCompanies.length > 0 ? <div style={{fontWeight: "bold", fontSize:"25px", color: "gray", marginTop:"30px"}}>Public Stores</div> : <></>}
                    <div className={styles.resultContainer} style={{marginTop: "5px"}}>
                        {
                            publicCompanies.map((res, index) => (
                                <Link href={res.companyLink} className={styles.storeCard} key={index}>
                                    <img src={res.companyImage} className={styles.storeImage}/>
                                    {res.companyName}
                                </Link>
                            ))

                        }
                    </div>
                </>
                : 
                <>
                {
            result[0] !== null ?
                    <div className={styles.resultContainer}>
                        {
                            result.map((res, index) => (
                                <Link href={res.companyLink} className={styles.storeCard} key={index}>
                                    <img src={res.companyImage} className={styles.storeImage}/>
                                    {res.companyName}
                                </Link>
                            ))

                        }
                    </div>
                    :
                    <div className={styles.noResults}>
                        <div style={{fontWeight: "bold", fontSize:"25px", color: "gray"}}>No results found</div>
                        <div>Interested in creating a prepopulated company store?</div>
                        <div>Reach out to <a href="/requestPortal" style={{color: "#4F71B5"}}>austin@pointofaction.com</a></div>
                    </div>
                    }
                </>
            }
            
        </div>
    );
}