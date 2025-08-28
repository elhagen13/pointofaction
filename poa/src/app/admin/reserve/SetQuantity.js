import styles from "./reserve.module.css";
import { useState, useEffect } from "react";
import { FiShoppingBag } from "react-icons/fi";

export default function SetQuantity({
  onClose,
  items,
  sizeDict,
  brandDict,
  descriptionDict,
}) {
  const [sizes, setSizes] = useState([]);
  const [orderQuant, setOrderQuant] = useState([]);
  const [sizeToItemMap, setSizeToItemMap] = useState({}); // Maps size to item with that size

  const getPriority = (size) => {
    if (size.includes("oz")) {
      return parseInt(size.slice(0, -2));
    }
    switch (size) {
      case "2XS":
        return 0;
      case "XS":
        return 1;
      case "S":
        return 2;
      case "M":
        return 3;
      case "L":
        return 4;
      case "XL":
        return 5;
      case "2XL":
        return 6;
      case "3XL":
        return 7;
      case "4XL":
        return 8;
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const onSubmit = () => {
    let addedItems = [];
    const currentBrand = items[0].brand || brandDict[items[0].brandId]?.brand;
    const currentDescription = items[0].description || descriptionDict[items[0].descriptionId]?.description;

    orderQuant.forEach((order, index) => {
      if (order !== 0 && parseInt(order) > 0) {
        const sizeKey = sizes[index][0];
        const itemForSize = sizeToItemMap[sizeKey];
        
        addedItems.push({
          image: items[0].image, // Assuming all items share the same image
          price: itemForSize ? itemForSize.price : items[0].price, // Use specific item's price
          style: items[0].style,
          description: currentDescription,
          brand: currentBrand,
          color: items[0].color,
          size: sizeKey,
          quantity: parseInt(order)
        });
      }
    });

    const curCart = [];
    const prevCart = getCartFromStorage();

    // Remove existing items that match
    for (const item of prevCart) {
      if (item.style === items[0].style && 
          item.description === currentDescription && // Fixed: was comparing style === description
          item.brand === currentBrand &&
          item.color === items[0].color) {
        continue;
      }
      curCart.push(item);
    }

    const finalCart = curCart.concat(addedItems);
    saveCartToStorage(finalCart);

    onClose();
  };

  const getCartFromStorage = () => {
    try {
      const cartData = localStorage.getItem("cart");
      if (!cartData) return [];
      
      const parsed = JSON.parse(cartData);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("Invalid cart data in localStorage, resetting cart:", error);
      localStorage.removeItem("cart");
      return [];
    }
  };

  // Safe function to save cart to localStorage
  const saveCartToStorage = (cart) => {
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error);
    }
  };

  // Updated useEffect with safe parsing
  useEffect(() => {
    let tempDict = {};
    let tempSizeToItemMap = {};
    console.log(items)
    for (const item of items) {
      let size = item.size || sizeDict[item.sizeId].size;
      const availableQuantity = item.quantity - (item.reserved ? item.reserved : 0);
      console.log(item, size, availableQuantity)
      
      if (!tempDict[size]) {
        tempDict[size] = {
          available: availableQuantity,
          reserved: item.reserved || 0
        };
        tempSizeToItemMap[size] = item;
      } else {
        tempDict[size].available += availableQuantity;
        tempDict[size].reserved += (item.reserved || 0)
        if (!tempSizeToItemMap[size]) {
          tempSizeToItemMap[size] = item;
        }
      }
    }

    const previouslyAddedSizes = {};
    const prevCart = getCartFromStorage();

    for (const item of prevCart) {
      if (item.style === items[0].style && 
          item.brand === (items[0].brand || brandDict[items[0].brandId]?.brand) &&
          item.color === items[0].color &&
          item.description === (items[0].description || descriptionDict[items[0].descriptionId]?.description)) {
        previouslyAddedSizes[item.size] = item.quantity;
      }
    }

    const arr = [];
    for (const [key, val] of Object.entries(tempDict)) {
      arr.push([key, val]);
    }

    // Sort first
    arr.sort((a, b) => {
      return getPriority(a[0]) - getPriority(b[0]);
    });

    // Create orderQuant based on sorted array
    let orderQuantArr = arr.map(([size]) => {
      return previouslyAddedSizes[size] || 0;
    });

    console.log(arr)

    setOrderQuant(orderQuantArr);
    setSizes(arr);
    setSizeToItemMap(tempSizeToItemMap);
  }, [items]);

  const validateInput = () => {
    setOrderQuant(
      orderQuant.map((quant, index) => {
        const numQuant = parseInt(quant) || 0; // Handle empty strings and NaN
        if (numQuant > sizes[index][1].available) {
          return sizes[index][1].available;
        }
        return Math.max(0, numQuant); // Ensure non-negative
      })
    );
  };

  return (
    <div className={styles.overlayBackground} onClick={handleOverlayClick}>
      <div className={styles.addItem} onClick={handleModalClick}>
        <div className={styles.top}>
          <img src={items[0].image} style={{ width: "300px" }}></img>
          <div className={styles.topText}>
            <div>Style #: {items[0].style}</div>
            <div>
              Brand:{" "}
              {items[0].brand || brandDict[items[0].brandId]?.brand || "N/A"}
            </div>
            <div>Color: {items[0].color}</div>
            <div>
              Description:{" "}
              {items[0].description ||
                descriptionDict[items[0].descriptionId]?.description ||
                "N/A"}
            </div>
          </div>
        </div>
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            margin: "20px 0",
            fontWeight: "bold",
          }}
        >
          <div
            style={{ width: "20%", border: "2px solid white" }}
            className={styles.box}
          >
            <div>Size</div>
            <div>Reserved</div>
            <div>Available</div>
            <div>Order</div>
            
          </div>
          <div
            style={{
              flexGrow: 1,
              border: "2px solid #dbdbdb",
              borderRadius: "20px",
            }}
            className={styles.box}
          >
            <div
              className={styles.row}
              style={{
                gridTemplateColumns: `repeat(${sizes.length}, calc(100% / ${sizes.length}))`,
              }}
            >
              {sizes.map((size, index) => (
                <div key={index} style={{ padding: "0 10px" }}>
                  {size[0]}
                </div>
              ))}
            </div>
            <div
              className={styles.row}
              style={{
                gridTemplateColumns: `repeat(${sizes.length}, calc(100% / ${sizes.length}))`,
              }}
            >
              {sizes.map((reserved, index) => (
                <div key={index} style={{ padding: "0 10px", color:"#ababab" }}>
                  {console.log(sizeToItemMap)}
                    {reserved[1].reserved}
                </div>
              ))}
            </div>
            <div
              className={styles.row}
              style={{
                gridTemplateColumns: `repeat(${sizes.length}, calc(100% / ${sizes.length}))`,
              }}
            >
              {sizes.map((available, index) => (
                <div key={index} style={{ padding: "0 10px" }}>
                  {available[1].available}
                </div>
              ))}
            </div>
            <div
              className={styles.row}
              style={{
                gridTemplateColumns: `repeat(${sizes.length}, calc(100% / ${sizes.length}))`,
              }}
            >
              {sizes.map((available, index) => (
                <div key={index} style={{ padding: "0 10px" }}>
                  <input
                    type="number"
                    min={0}
                    max={sizes[index][1]}
                    value={orderQuant[index]}
                    className={styles.input}
                    onBlur={validateInput}
                    onChange={(e) => setOrderQuant(
                        orderQuant.map((quant, i) => {
                            if(i === index) return e.target.value
                            return quant
                        })
                    )}
                  ></input>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{width:"100%", display:"flex", justifyContent:"end", padding:"20px", paddingTop: "0"}}>
                <div className={styles.shoppingButton}  onClick={onSubmit} >
                    <FiShoppingBag/>
                    Add to Order
                </div>
              </div>
      </div>
    </div>
  );
}