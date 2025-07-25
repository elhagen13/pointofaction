'use client'
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
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
        <div>
            {id}
        </div>
    )

}