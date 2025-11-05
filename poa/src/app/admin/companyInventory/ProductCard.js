import { GrNext, GrPrevious } from "react-icons/gr";
import styles from "./productCard.module.css"
import { useState, useEffect } from "react";

export default function ProductCard({company, setEditItemOpen}) {
    const [images, setImages] = useState([]);
    const [currentImage, setCurrentImage] = useState(0)
    console.log(company)
    useEffect(() => {
        getImages();
    }, [company])



    const getImages = () => {   
        setImages(company.map((item) => item.image))

    }

    const getQuantity = () => {
        return company.reduce((a, b) => a + b.productDetails.reduce((a, b) => a + b.quantity, 0), 0)
    }


    return (
        <div className={styles.productCardContainer}>
            <h3>{company[0].company[0].company} - {company.length} products - {getQuantity()} total</h3>
            <div className={styles.imageList}>
                    {images.map((image, index) => 
                        <div className={styles.imageListImageContainer} 
                        onClick={() => setEditItemOpen(company[index])}
                        style={{cursor:"pointer"}}>
                            <img src={image} className={styles.imageListImage}></img>
                        </div>
                    )}
            </div>
            
        </div>
    )
}