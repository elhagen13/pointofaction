'use client'
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./page.module.css"
export default function Box(){
    const { id } = useParams();
    const [items, setItems] = useState([])
    const [boxId, setBoxId] = useState("")

    useEffect(() => {
        const getBoxId = async() => {
            const response = await fetch("/api/inventory/box", {
                method: "GET",
            });
            const result = await response.json();
            console.log(result)

            const boxId = result.data.find((item) => item.boxId == id)._id
            setBoxId(boxId)
        }

        getBoxId()
       
    }, [])

    useEffect(() => {
        const getItems = async() => {
            const response = await fetch("/api/inventory/item", {
                method: "GET",
            });
            const result = await response.json();

            setItems(result.data.filter((item) => item.boxId == boxId))

        }

        getItems()
       
    }, [boxId])

    useEffect(() => {
        console.log(items)
    }, [items])

    return(
        <div className={styles.scanPage}>
            <h2>
                Box #{id} Contents
            </h2>
            {
                items.map((item, index) => (
                    <div key={index} className={styles.inventoryRow}>
                        <div className={styles.imagePreview}>
                            <img src={item.image} className={styles.previewImage}/>
                        </div>
                        <div style={{display:"flex", flexDirection:"column"}}>
                        <div><span style={{fontWeight:"bold"}}>Description:</span> {item.description} </div>
                        <div><span style={{fontWeight:"bold"}}>Color:</span> {item.color}</div>
                        </div>
                        <div style={{display:"flex", flexDirection:"column"}}>
                        <div><span style={{fontWeight:"bold"}}>Size:</span> {item.size}</div>
                        <div><span style={{fontWeight:"bold"}}>Style:</span> {item.style}</div>
                        </div>
                    </div>
                ))
            }
        </div>
    )

}