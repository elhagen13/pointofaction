'use client'
import AddGalleryItem from "../Gallery/AddGalleryItem"
import { useState } from "react"
export default function ComponentPlayground(){
    const [open, setOpen] = useState(true)
    return(
        <div>
            {open && <AddGalleryItem onClose={() => setOpen(false)}/>}
        </div>
    )
}