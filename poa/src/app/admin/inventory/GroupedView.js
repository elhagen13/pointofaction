"use client";
import { RiContractUpDownLine } from "react-icons/ri";
import styles from "./inventory.module.css";
import { useState, useEffect, useMemo } from "react";

export default function GroupedView({
  items,
  onClose,
  boxDict,
  sizeDict,
  brandDict,
  descriptionDict,
  setEditBoxOpen,
  setEditItemOpen,
}) {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };
  console.log(items);

  const [sortedItems, setSortedItems] = useState([]);
  const [colorDict, setColorDict] = useState({});
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  useEffect(() => {
    const dict = {};
    for (const item of items) {
      if (dict[item.color]) {
        dict[item.color].totalQuant += item.quantity;
        dict[item.color].items.push(item);
      } else {
        dict[item.color] = {
          totalQuant: item.quantity,
          items: [item],
          sizes: {},
        };
      }

      if (dict[item.color].sizes[sizeDict[item.sizeId]?.size || item.size]) {
        dict[item.color].sizes[sizeDict[item.sizeId]?.size || item.size] +=
          item.quantity;
      } else {
        dict[item.color].sizes[sizeDict[item.sizeId]?.size || item.size] =
          item.quantity;
      }
    }
    setSortedItems(
      Object.entries(dict).sort((a, b) => b[1].totalQuant - a[1].totalQuant)
    );
    setColorDict(dict);
  }, [items]);

  useEffect(() => {
    if (sortedItems.length > 0) setSelectedColor(sortedItems[0][0]);
  }, [sortedItems]);

  return (
    <div className={styles.overlayBackground} onClick={handleOverlayClick}>
      <div
        className={styles.addItem}
        onClick={handleModalClick}
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <h2>
          {sortedItems.length} colors found for "
          {brandDict[items[0].brandId]?.brand || items[0].brand} {items[0].style}"
        </h2>
        <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
          <div
            style={{
              boxShadow: "0 0 2px 2px #bfbfbf",
              borderRadius: "10px",
              overflow: "hidden",
              backgroundColor: "#f0f0f0",
              height: "fit-content",
              paddingBottom:"10px"
            }}
          >
            <img
              src={colorDict[selectedColor]?.items[0].image}
              style={{ width: "350px", height: "350px", objectFit: "cover" }}
            ></img>
            <div style={{ margin: "5px 10px" }}>
              <span style={{ fontWeight: "bold" }}>Description: </span>
              {descriptionDict[colorDict[selectedColor]?.items[0].descriptionId]
                ?.description ||
                colorDict[selectedColor]?.items[0].description ||
                "N/A"}
            </div>
            <div style={{ margin: "5px 10px" }}>
              <span style={{ fontWeight: "bold" }}>Color: </span>
              {selectedColor}
            </div>
            <div style={{ margin: "5px 10px" }}>
              <span style={{ fontWeight: "bold" }}>Total Quantity: </span>
              {colorDict[selectedColor]?.totalQuant}
            </div>
          </div>
          <div className={styles.matchingInventory}>
            <div className={styles.availableColors}>
              {Object.entries(colorDict).map(([key, val]) => (
                <div
                  style={{
                    boxShadow: "0 0 3px gray",
                    backgroundColor:
                      selectedColor === key ? "#a2bdac" : "rgb(219, 213, 213)",
                    width:"100px",
                    wordBreak:"break-word"
                  }}
                  onClick={() => {
                    setSelectedColor(key);
                    setSelectedSize(null);
                  }}
                >
                  <img
                    src={val.items[0].image}
                    style={{
                      width: "75px",
                      height: "75px",
                      objectFit: "cover",
                    }}
                  ></img>
                  <div style={{ fontWeight: "bold", marginTop: "10px" }} >
                    {key}
                  </div>
                  <div style={{ marginBottom: "10px" }}>{val.totalQuant}</div>
                </div>
              ))}
            </div>
            <div className={styles.availableSizes}>
              <div style={{ borderRadius: "10px"}}>
                {colorDict[selectedColor] &&
                  Object.entries(colorDict[selectedColor].sizes).map(
                    ([key, val]) => (
                      <div
                        className={styles.sizeTable}
                        style={{ height: "100%", cursor: "pointer", minWidth:"50px" }}
                        onClick={() => {
                          setSelectedSize(key);
                        }}
                      >
                        <div
                          style={{
                            fontWeight: "bold",
                            backgroundColor: "#d1d1d1",
                            
                          }}
                        >
                          {key}
                        </div>
                        <div style={{ backgroundColor: "#f0f0f0" }}>{val}</div>
                      </div>
                    )
                  )}
              </div>
            </div>
            {selectedSize && (
              <div style={{ fontWeight: "bold" }}>
                {
                  (colorDict[selectedColor]?.items.filter(
                    (item) =>
                      (sizeDict[item.sizeId]?.size || item.size) ===
                      selectedSize
                  )).length
                }{" "}
                boxes with item
              </div>
            )}

            <div
              className={`${styles.scrollableContainer} ${selectedSize ? styles.heightTransitionMax : styles.heightTransitionMin}`}
            >
              {selectedColor &&
                colorDict[selectedColor]?.items.map((item) => {
                  if (
                    (sizeDict[item.sizeId]?.size || item.size) === selectedSize
                  ) {
                    return (
                      <div
                        style={{ width: "200px", cursor: "pointer" }}
                        onClick={() => {
                          onClose();
                          item.boxId
                            ? setEditBoxOpen(boxDict[item.boxId])
                            : setEditItemOpen(item);
                        }}
                      >
                        <div className={styles.groupImageContainer}>
                          <img src={item.image}></img>
                        </div>
                        <div>Box #: {boxDict[item.boxId]?.boxId || "N/A"}</div>
                        <div>
                          Location:{" "}
                          {boxDict[item.boxId]?.location ||
                            item.location ||
                            "N/A"}
                        </div>
                        <div>
                          Size:{" "}
                          {sizeDict[item.sizeId]?.size || item.size || "N/A"}
                        </div>
                        <div>Quantity Remaining: {item.quantity}</div>
                      </div>
                    );
                  }
                  return <></>;
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
