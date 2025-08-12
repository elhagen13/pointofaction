import styles from "./reserve.module.css";
import { useState, useEffect } from "react";
import { FiShoppingBag } from "react-icons/fi";

export default function SetQuantity({
  onClose,
  items,
  sizeDict,
  brandDict,
  descriptionDict,
  cart, addToCart
}) {
  const [sizes, setSizes] = useState([]);
  const [orderQuant, setOrderQuant] = useState([]);


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
    let addedItems = []
    orderQuant.forEach((order, index) => {
        if(order !== 0){
            addedItems.push({
                style: items[0].style,
                brand: items[0].brand || items[0].brandId,
                color: items[0].color,
                size: sizes[index]
            })
        }}
    )

    addToCart(cart.concat(addedItems))

    onClose();
  }

  useEffect(() => {
    let tempDict = {};
    console.log("items", items)
    for (const item of items) {
      let size = item.size || sizeDict[item.sizeId].size;
      if (!tempDict[size]){
        tempDict[size] = item.quantity - (item.reserved ? item.reserved : 0);
      }
      else
        tempDict[size] += item.quantity - (item.reserved ? item.reserved : 0);
    }
    console.log("tempDict", tempDict)

    const arr = [];
    let orderQuantArr = []

    for (const [key, val] of Object.entries(tempDict)) {
      arr.push([key, val]);
      orderQuantArr.push(0)
    }
    setOrderQuant(orderQuantArr)


    arr.sort((a, b) => {
      return getPriority(a[0]) - getPriority(b[0]);
    });

    console.log(arr);
    setSizes(arr);
  }, [items]);

  const validateInput = () => {
    setOrderQuant(
      orderQuant.map((quant, index) => {
        if (parseInt(quant) > sizes[index][1]) {
          return sizes[index][1];
        }
        return parseInt(quant);
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
            <div>Available</div>
            <div>Size</div>
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
              {sizes.map((available, index) => (
                <div key={index} style={{ padding: "0 10px" }}>
                  {available[1]}
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
                <div style={{ padding: "0 10px" }}>
                  <input
                    key={index}
                    type="number"
                    min={0}
                    max={sizes[index][1]}
                    value={orderQuant[index]}
                    className={styles.input}
                    onBlur={() => validateInput()}
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
        <div onClick={onSubmit} style={{width:"100%", display:"flex", justifyContent:"end", padding:"20px", paddingTop: "0"}}>
                <div className={styles.shoppingButton}>
                    <FiShoppingBag/>
                    Add to Order
                </div>
              </div>
      </div>
    </div>
  );
}
