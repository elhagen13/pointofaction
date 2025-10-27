import { useState, useEffect } from "react";
import styles from "./cartPopup.module.css"
import { Key } from "lucide-react";
import { FaTrash } from "react-icons/fa";
import Link from "next/link";

export default function CartPopup({ visible, onClose, boxDict, inventoryDict, savedCart, setSavedCart }) {
    const [empty, setEmpty] = useState(true)
    const [total, setTotal] = useState(0)


    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleModalClick = (e) => {
        e.stopPropagation();
    };



    useEffect(() => {
        if (savedCart.boxes?.length > 0 || (savedCart.items && Object.entries(savedCart.items).length > 0)
            || savedCart.boxLike?.length > 0) {
            setEmpty(false)
        }

        let total = 0;
        if (Object.keys(inventoryDict).length > 0 && savedCart.items) {
            Object.entries(savedCart.items).forEach(([key, value]) => {
                total += (inventoryDict[key]?.price || 0) * value
            })
        }
        if (Object.keys(inventoryDict).length > 0 && savedCart.boxLike) {
            console.log(savedCart.boxLike)
            savedCart.boxLike.forEach((item) => {
                total += parseFloat(item.discountedPrice)
            })
        }
        if (Object.keys(boxDict).length > 0 && savedCart.boxes) {
            savedCart.boxes.forEach((id) => {
                let price = getPrice(boxDict[id])[1]
                total += parseFloat(price);
            })

        }
        setTotal(total)
    }, [savedCart, boxDict, inventoryDict])

    useEffect(() => {console.log(total)}, [total])

    const getDescription = (box) => {
        const descriptors = new Set();
        if (box) {
            box.items.forEach((item) => {
                descriptors.add(`${item.brand} ${item.description}s`)
            })
        }
        const descriptorArray = Array.from(descriptors)

        let descriptionString = ""
        descriptorArray.forEach((descriptor, index) => {
            descriptionString += descriptor
            if (index < descriptorArray.length - 2) {
                descriptionString += ", "
            }
            else if (index < descriptorArray.length - 1) {
                descriptionString += " and "
            }
        })

        return (descriptionString)
    }

    const getPrice = (box) => {
        let price = 0

        if (box) {
            box.items.forEach((item) => {
                price += parseFloat(item.price) * item.quantity
            })
        }

        return [price.toFixed(2), (price - price * (box.discount * 0.01)).toFixed(2)]

    }

    const removeBox = (id) => {
        setSavedCart({
            ...savedCart,
            boxes: savedCart.boxes.filter(box => box !== id)
        })
    }
    
    const removeBoxLike = (id) => {
         setSavedCart({
            ...savedCart,
            boxLike: savedCart.boxLike.filter(item => item.itemId !== id)
        })
    }

    const removeItem = (id) => {
        const idDict = savedCart.items;
        console.log("BEFORE", idDict)
        delete idDict[id]
        console.log("AFTER", idDict)
        setSavedCart({
            ...savedCart,
            items: idDict

        })
    }



    return (
        <div className={visible ? styles.overlayContainer : ""} onClick={handleOverlayClick}>
            <div className={`${styles.overlay} ${visible ? styles.visible : styles.invisible}`}
                onClick={() => handleModalClick}>
                <div className={styles.cartContainer}>
                    <h2 style={{ marginBottom: "20px" }}>Cart</h2>
                    {
                        empty ? <div style={{ fontSize: "1.5rem", fontStyle: "italic", color: "#d7d7d7ff", fontWeight: "bold" }}>Cart Empty</div> :
                            <div>
                                {savedCart.boxes?.map((id) => {
                                    if (boxDict[id]) {
                                        return (
                                            <div className={styles.cartRow}>
                                                <div className={styles.item}>
                                                    <div className={styles.thumbnailContainer}>
                                                        <img className={styles.thumbnail} src={boxDict[id].image}></img>
                                                    </div>
                                                    <div>{boxDict[id] && getDescription(boxDict[id])}</div>
                                                </div>
                                                <div className={styles.prices}>
                                                    <FaTrash className={styles.trash} onClick={() => removeBox(id)} />
                                                    ${boxDict[id] && getPrice(boxDict[id])[1]}
                                                </div>

                                            </div>
                                        )
                                    }
                                }
                                )}
                                {savedCart.boxLike?.map((item) => {
                                    if (inventoryDict && inventoryDict[item.itemId]) {
                                        return (
                                            <div className={styles.cartRow}>
                                                <div className={styles.item}>
                                                    <div className={styles.thumbnailContainer}>
                                                        <img className={styles.thumbnail} src={inventoryDict[item.itemId].image}></img>
                                                    </div>
                                                    <div>{inventoryDict[item.itemId] && inventoryDict[item.itemId].description}</div>
                                                </div>
                                                <div className={styles.prices}>
                                                    <FaTrash className={styles.trash} onClick={() => removeBoxLike(item.itemId)} />
                                                    ${item.discountedPrice}
                                                </div>

                                            </div>
                                        )

                                    }


                                }
                                )}
                                {savedCart.items && Object.entries(savedCart.items).map(([id, quantity]) => {
                                    if (inventoryDict && inventoryDict[id]) {
                                        const obj = inventoryDict[id]
                                        return (
                                            <div className={styles.cartRow}>
                                                <div className={styles.item}>
                                                    <div className={styles.thumbnailContainer}>
                                                        <img className={styles.thumbnail} src={inventoryDict[id].image}></img>
                                                    </div>
                                                    <div>
                                                        {obj.size} {obj.color} {obj.brand} {obj.description}
                                                    </div>

                                                </div>
                                                <div className={styles.prices} style={{ color: "black" }}>
                                                    <FaTrash className={styles.trash} onClick={() => removeItem(id)} />
                                                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "end", alignItems: "end" }}>
                                                        <div style={{ color: "#8a8a8aff" }}>${obj.price} x {quantity}=</div>
                                                        <div style={{ color: "black" }}>${obj.price * quantity}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }
                                }
                                )}
                            </div>
                    }

                </div>
                <Link href="/checkout"><div className={styles.checkoutContainer}><button className={styles.purchase} disabled={empty}>Checkout ~ ${total.toFixed(2)}</button></div></Link>


            </div>

        </div>
    )
}