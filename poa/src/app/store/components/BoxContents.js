import styles from "./boxContents.module.css"
import { useState, useEffect } from "react";
import { GrNext, GrPrevious } from "react-icons/gr";
import { IoMdAddCircle, IoMdAddCircleOutline, IoMdRemoveCircle, IoMdRemoveCircleOutline } from "react-icons/io";



export default function BoxContents({ box, onClose, savedCart, setSavedCart, saveCartToStorage }) {
    const [description, setDescription] = useState("")
    const [images, setImages] = useState([]);
    const [currentImage, setCurrentImage] = useState(0);
    const [price, setPrice] = useState(0)
    const [discountedPrice, setDiscountedPrice] = useState(0)

    const [quantities, setQuantities] = useState([])

    const [submitting, setSubmitting] = useState(false);
    const [boxAdded, setBoxAdded] = useState(false)


    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleModalClick = (e) => {
        e.stopPropagation();
        console.log(box)
        console.log(quantities)
    };

    useEffect(() => {
        getDescription();
        getImages();
        getPrice();
        setArray();
    }, [])


    const getDescription = () => {
        if(!box.items){
            setDescription(`${box.color} ${box.size} ${box.brand} ${box.description}`)
            return
        }
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
        setDescription(descriptionString)

    }

    const getImages = () => {
        const imageList = [box.image]
        const imageDict = {}
        if (box?.items) {
            box.items.forEach((item) => {
                imageDict[`${item.brand} ${item.style} ${item.color}`] = item.image
            })

        }
        setImages(imageList.concat(Object.values(imageDict)))


    }

    useEffect(() => {
        setArray()
    }, [savedCart])

    const setArray = () => {
        let arr = []
        if(!box.items){
            arr = [[0, true]]
        }
        if (box?.items){
            box.items.forEach((item) => arr.push([((savedCart.items && savedCart.items[item._id]) || 0), true]))
        }
        setQuantities(arr)
    }

    const getPrice = () => {
        let price = 0

        if(!box.items){
            price = parseFloat(box.price) * box.quantity
            
        }
        else if (box) {
            box.items.forEach((item) => {
                console.log("ITEM PRICE", item.price)
                console.log("PRICE", price)
                price += parseFloat(item.price) * item.quantity
            })
        }

        setPrice(price.toFixed(2))
        setDiscountedPrice((price - price * (box.discount * 0.01)).toFixed(2))

    }

    const validateInput = (index, max) => {
        setQuantities(
            quantities.map(([quantity, isValid], i) => {

                if (index === i && (Number.isNaN(parseInt(quantity)) || quantity > max)) return [quantity, false]
                else if (index === i) return [parseInt(quantity), true]
                else return [quantity, isValid]
            }))
    }

    const changeInput = (e, index) => {

        setQuantities(
            quantities.map(([quantity, isValid], i) => {
                if (index === i) return [e.target.value, isValid]
                else return [quantity, isValid]
            }))

    }

    const increase = (index, max) => {
        const quantity = parseInt(quantities[index])
        setQuantities(
            quantities.map(([q, isValid], i) => {
                if (i === index && quantity < max) return [quantity + 1, isValid]
                else return [q, isValid]
            })
        )
    }

    const decrease = (index) => {
        const quantity = parseInt(quantities[index])
        setQuantities(
            quantities.map(([q, isValid], i) => {
                if (i === index && quantity > 0) return [quantity - 1, isValid]
                else return [q, isValid]
            })
        )
    }

    const checkDisabled = () => {
        if (!box || boxAdded) return true;
        let sum = 0
        quantities.forEach(([quantity, isValid], index) => {
            sum += quantity * (box.items ? box.items[index].price : box.price);
            if (!isValid) return true
        })

        return sum < box.minPrice
    }


    const onSubmit = (b = false) => {
        if (submitting) return;
        let cart = { ...savedCart };

        if (b && box.items) {
            // first remove any individualitems that have been added
            box?.items.forEach((item) => {
                if (cart.items && cart.items[item._id]) delete cart.items[item._id]
            })

            if (cart.boxes) {
                cart.boxes.push(box._id)
            }
            else {
                cart["boxes"] = [box._id]
            }

        }
        else if(b){
            //if the purchase is by the box, but the items arent techically in a box
            if (cart.items && cart.items[box._id]) delete cart.items[box._id]
            const boxLikeItem = {
                origPrice: price,
                discountedPrice: discountedPrice,
                itemId: box._id,
                image: box.image
            }
            if (cart.boxLike) {
                cart.boxLike.push(boxLikeItem)
            }
            else {
                cart["boxLike"] = [boxLikeItem]
            }
        }
        else if(box.items) {
            box?.items.forEach((item, index) => {
                if (quantities[index][1] && quantities[index][0] > 0) {
                    if (!cart.items) {
                        cart["items"] = {}
                    }
                    cart.items[item._id] = quantities[index][0]
                }
            })
        }
        else{
            if (quantities[0][1] && quantities[0][0] > 0) {
                    if (!cart.items) {
                        cart["items"] = {}
                    }
                    cart.items[box._id] = quantities[0][0]
                }
        }
        

        saveCartToStorage(cart);
        setSavedCart(cart)
        onClose();

    }

    useEffect(() => {
        if (savedCart.boxes) savedCart.boxes.some((id) => id == box._id) ? setBoxAdded(true) : setBoxAdded(false)
        console.log(savedCart)
    }, [savedCart])


    return (
        <div className={styles.overlayBackground} onClick={handleOverlayClick}>
            <div className={styles.addItem} onClick={handleModalClick}>
                <div style={{ width: "30%" }}>
                    <div className={styles.imageContainer}>
                        <img src={images[currentImage]} className={styles.image}></img>
                        <div className={styles.imagePageContainer}>
                            <div className={styles.nav} onClick={() => setCurrentImage(currentImage - 1 < 0 ? images.length - 1 : currentImage - 1)}><GrPrevious /></div>
                            <div className={styles.imagePage}>
                                {
                                    images.map((image, index) => (
                                        <div className={`${styles.imageDots} ${index === currentImage && styles.imageDotsActive}`}
                                            onClick={() => setCurrentImage(index)}
                                        />
                                    ))
                                }
                            </div>
                            <div className={styles.nav}
                                onClick={() => setCurrentImage(currentImage + 1 >= images.length ? 0 : currentImage + 1)}
                            ><GrNext /></div>

                        </div>
                    </div>
                    <div className={styles.prices}>
                        <div style={{ color: "#a80f0fff", textDecoration: "line-through" }}>${price}</div>
                        <div style={{ color: "#2c4cb4ff" }}>${discountedPrice}</div>
                    </div>
                    <div style={{ width: "100%", textAlign: "right", color: "#a80f0fff", fontWeight: "bold", fontSize: "0.9rem", marginTop: "10px" }}>*Individual item purchases must exceed ${box.minPrice}</div>
                    <div className={styles.buttonContainer}>
                        <button className={styles.purchase} onClick={() => onSubmit(true)} disabled={boxAdded}>
                            {boxAdded ? "Box Added" : "Add Box to Cart"}
                        </button>
                    </div>
                </div>
                <div style={{ flexGrow: 1 }}>
                    <h2>{description}</h2>

                    <h3 style={{ marginTop: "20px", color: "#acaaaaff" }}>Add Individual Items to Cart</h3>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th></th>
                                <th style={{ padding: "5px" }}>Description</th>
                                <th>Brand</th>
                                <th>Style</th>
                                <th>Size</th>
                                <th>Color</th>
                                <th>Price</th>
                                <th>Available</th>
                                <th>Quantity</th>

                            </tr>
                        </thead>
                        <tbody>
                            {
                                box.items?.map((item, index) =>
                                    <tr style={{ backgroundColor: index % 2 == 0 ? "rgba(218, 223, 226, 1)" : "rgba(200, 210, 218, 1)" }}>
                                        <td>
                                            <div className={styles.imageThumbnailContainer}>
                                                <img src={item.image} className={styles.imageThumbnail} />
                                            </div>
                                        </td>
                                        <td>{item.description}</td>
                                        <td>{item.brand}</td>
                                        <td>{item.style}</td>
                                        <td>{item.size}</td>
                                        <td>{item.color}</td>
                                        <td>${item.price}</td>
                                        <td>{item.quantity}</td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                <IoMdRemoveCircleOutline size={20}
                                                    color={(quantities[index] && quantities[index][0] > 0) ? "rgba(60, 60, 60, 1)" : "#adadadff"}
                                                    onClick={() => decrease(index)} />
                                                <input className={styles.input}
                                                    style={{ boxShadow: (quantities[index] && quantities[index][1]) ? "none" : "0 0 1px 3px #ce7b7bff" }}
                                                    onChange={(e) => changeInput(e, index)}
                                                    value={quantities[index] ? quantities[index][0] : "0"}
                                                    onBlur={() => validateInput(index, item.quantity)} />
                                                <IoMdAddCircleOutline size={20} color={(quantities[index] &&
                                                    quantities[index][0] < item.quantity) ? "rgba(60, 60, 60, 1)" : "rgba(156, 156, 156, 1)"}
                                                    onClick={() => increase(index, item.quantity)} />
                                            </div>
                                        </td>
                                    </tr>
                                )
                                ||
                                <tr style={{ backgroundColor: "rgba(218, 223, 226, 1)" }}>
                                    <td>
                                        <div className={styles.imageThumbnailContainer}>
                                            <img src={box.image} className={styles.imageThumbnail} />
                                        </div>
                                    </td>
                                    <td>{box.description}</td>
                                    <td>{box.brand}</td>
                                    <td>{box.style}</td>
                                    <td>{box.size}</td>
                                    <td>{box.color}</td>
                                    <td>${box.price}</td>
                                    <td>{box.quantity}</td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                            <IoMdRemoveCircleOutline size={20}
                                                color={(quantities[0] && quantities[0][0] > 0) ? "rgba(60, 60, 60, 1)" : "#adadadff"}
                                                onClick={() => decrease(0)} />
                                            <input className={styles.input}
                                                style={{ boxShadow: (quantities[0] && quantities[0][1]) ? "none" : "0 0 1px 3px #ce7b7bff" }}
                                                onChange={(e) => changeInput(e, 0)}
                                                value={quantities[0] ? quantities[0][0] : "0"}
                                                onBlur={() => validateInput(0, box.quantity)} />
                                            <IoMdAddCircleOutline size={20} color={(quantities[0] &&
                                                quantities[0][0] < box.quantity) ? "rgba(60, 60, 60, 1)" : "rgba(156, 156, 156, 1)"}
                                                onClick={() => increase(0, box.quantity)} />
                                        </div>
                                    </td>
                                </tr>
                            }
                        </tbody>
                    </table>
                    <div className={styles.buttonContainer}>
                        {!boxAdded && <button className={styles.purchase} disabled={checkDisabled()} onClick={() => onSubmit(false)}>
                            Add Individual Items to Cart ~ Minimum Purchase ${box.minPrice}
                        </button>}
                    </div>
                </div>
            </div>
        </div>
    )

}