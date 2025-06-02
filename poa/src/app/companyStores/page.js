"use client"

import { useEffect, useState } from "react";
import styles from "./companyStores.module.css"
import { IoSearch } from "react-icons/io5";
import Link from "next/link";

export default function companyStores() {
    const [search, setSearch] = useState("")
    const [result, setResult] = useState([])
    const [stores, setCompanies] = useState([])

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
      
        setResult(array.filter(item => {
          const itemWords = item.companyName.toLowerCase().split(/\s+/);
          
          return searchWords.every(searchWord => 
            itemWords.some(itemWord => itemWord === searchWord)
          );
        }));
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
        </div>
    );
}