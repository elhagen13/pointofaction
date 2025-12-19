'use client'
import React from "react";
import {useEffect, useState} from "react"
import styles from "./page.module.css"

export default function MobileReservation({ params }) {
  const { id } = React.use(params);
  const [reservation, setReservation] = useState({});
  const [boxMap, setBoxMap] = useState({})

  useEffect(() => {
    getReservation();
  }, [])


  const getReservation = async () => {
    const fetchReservation = await fetch(
      `/api/catalog/reservation/${id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const result = await fetchReservation.json();

    setReservation(result.data[0]);
    let tempDict = {"No Box": []}
    console.log("RESERVATION", result.data[0])
    result.data[0].items.forEach((item) => {
        if(!item.currentItemData.boxId){
            tempDict["No Box"].push(item)
        }
        if(!tempDict[item.currentItemData.boxData.boxId]) tempDict[item.currentItemData.boxData.boxId] = []
        tempDict[item.currentItemData.boxData.boxId].push(item)
    })
    console.log(tempDict)
    setBoxMap(tempDict)
  };

  const getDescription = (item) => {
    return `${item.size || item.sizeData.size || "No Size"} 
    ${item.color} ${item.brand || item.brandData.brand || "No Brand"}
    ${item.description || item.descriptionData.description || "No Description"} ${item.style}`
  }


    return(
        <div>
            {
                boxMap && Object.entries(boxMap).map(([key, value]) => 
                <>
                <div className={styles.row}>
                    <img src={value[0]?.currentItemData?.boxData?.image} className={styles.boxImage}></img>
                    {key}
                </div>
                <div>
                    {value.map((item) =>
                    <div>
                    {getDescription(item.currentItemData)}
                    </div>)}
                </div>
                </>)
            }

        </div>

    )
}