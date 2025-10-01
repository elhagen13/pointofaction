"use client";
import { RiContractUpDownLine } from "react-icons/ri";
import styles from "./inventory.module.css";
import { useState, useEffect, useMemo } from "react";
import { BeatLoader } from "react-spinners";
import { IoAddSharp, IoSearch } from "react-icons/io5";

export default function GroupedView({
  items,
  onClose,
  boxDict,
  sizeDict,
  brandDict,
  descriptionDict,
  setEditBoxOpen,
  setEditItemOpen,
  refresh,
  getKey,
  keyDict,
  savedInfo,
  setSavedInfo,
  setAddBoxOpen
}) {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const [sortedItems, setSortedItems] = useState([]);
  const [colorDict, setColorDict] = useState({});
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  const [searchValue, setSearchValue] = useState("");

  const [addReservation, setAddReservation] = useState(false);
  const [barHover, setBarHover] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [reservationHover, setReservationHover] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [reservationQuantity, setReservationQuantity] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [mouse, setMouse] = useState([0, 0]);

  useEffect(() => {
    getReservations();
  }, []);

  const onMouseMoveIn = (e, index) => {
    setReservationHover(index);
    setMouse([e.clientX, e.clientY]);
  };

  const getReservations = async () => {
    const response = await fetch("/api/catalog/reservation", {
      method: "GET",
    });
    const result = await response.json();
    setReservations(result.data);
  };

  const addToReservation = async () => {
    setSubmitting(true);
    const response = await fetch("/api/catalog", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        style: items[0].style,
        color: selectedColor,
        brand: brandDict[items[0].brandId]?.brand || items[0].brand || "N/A",
        size: selectedSize,
        quantityToReserve: reservationQuantity,
      }),
    });
    const result = await response.json();
    try {
      const editReservation = await fetch(
        `/api/catalog/reservation/${reservations[selectedReservation]._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reservationDetails: result.reservationDetails,
            type: "add"
          }),
        }
      );
      const editReservationResult = await editReservation.json();
      setSubmitting(false);
      setReservationQuantity(0);
      setSelectedReservation(null);
      await refresh();
      console.log("refreshed");
      await getReservations();
    } catch (error) {
      alert(error);
      alert("Could not add item to reservation");
    }
  };

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

  const filteredColors = useMemo(() => {
    return Object.entries(colorDict).filter(
      ([key, value]) =>
        key === selectedColor ||
        key.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [colorDict, searchValue]);

  const addToBox = () => {
    console.log(descriptionDict)
    if(!colorDict[selectedColor]) return;
    const item = colorDict[selectedColor]?.items[0]
    console.log(item)
    const contents = [
      {
        imageUrl: item.image || "",
        descriptionId: item.descriptionId || null,
        description: item.description || null,
        style: item.style || "", 
        brandId: item.brandId || null,
        brand: item.brand || null,
        sizeId: item.sizeId || null,
        size: item.size || null,
        color: item.color || "",
        price: item.price || 0
      }
    ]
    console.log(contents)
    setSavedInfo({
      addItem: {...savedInfo.addItem},
      addBox: {
        contents: contents
      }
    })
    setAddBoxOpen(true);
    onClose();
  }

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
          {brandDict[items[0].brandId]?.brand || items[0].brand}{" "}
          {items[0].style}"
        </h2>
        <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
          <div
            style={{
              boxShadow: "0 0 2px 2px #bfbfbf",
              borderRadius: "10px",
              overflow: "hidden",
              backgroundColor: "#f0f0f0",
              height: "fit-content",
              paddingBottom: "10px",
            }}
          >

            <img
              src={colorDict[selectedColor]?.items[0].image}
              style={{ width: "350px", height: "350px", objectFit: "contain" }}
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
          <div
            className={`${styles.loaderOverlay} ${submitting ? styles.visible : styles.invisible}`}
          >
            <BeatLoader size={12} />
          </div>
          <div
            className={`${styles.matchingInventory} ${submitting ? styles.loading : ""}`}
          >
            <div className={styles.searchContainer}>
              <IoSearch className={styles.search} />
              <input
                className={styles.searchInput}
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                }}
                placeholder="Search color..."
              />
            </div>
            <div className={styles.availableColors}>
              {filteredColors.map(([key, val]) => (
                <div
                  style={{
                    boxShadow: "0 0 3px gray",
                    backgroundColor:
                      selectedColor === key ? "#a2bdac" : "rgb(219, 213, 213)",
                    maxWidth: "150px",
                    height: "100%",
                    wordBreak: "break-word",
                  }}
                  onClick={() => {
                    setSelectedColor(key);
                    setSelectedSize(null);
                  }}
                >
                  <div style={{ backgroundColor: "white", position: "relative" }}>
                    <img
                      src={val.items[0].image}
                      style={{
                        width: "75px",
                        height: "75px",
                        objectFit: "contain",
                        borderRadius: "5px",
                      }}
                    ></img>
                    {val.items.some(item => keyDict[getKey([item])]?.quantity > item.quantity) && <div className={styles.partialOverlay} />}
                  </div>
                  <div style={{ fontWeight: "bold", marginTop: "10px" }}>
                    {key}
                  </div>
                  <div style={{ marginBottom: "10px" }}>{val.totalQuant}</div>
                </div>
              ))}
            </div>
            <div className={styles.availableSizes}>
              <div style={{ borderRadius: "10px" }}>
                {colorDict[selectedColor] &&
                  Object.entries(colorDict[selectedColor].sizes).map(
                    ([key, val]) => (
                      <div
                        className={styles.sizeTable}
                        style={{
                          height: "100%",
                          cursor: "pointer",
                          minWidth: "50px",
                        }}
                        onClick={() => {
                          console.log(key, val)
                          setSelectedSize(key);
                        }}
                      >
                        <div
                          style={{
                            fontWeight: "bold",
                            backgroundColor:
                              selectedSize === key ? "#9c9b9a" : "#d1d1d1",
                          }}
                        >
                          {key}
                        </div>
                        <div
                          style={{
                            backgroundColor:
                              (keyDict[`${brandDict[items[0].brandId]?.brand || items[0].brand}-${items[0].style}-${key}-${selectedColor}`]
                                && val === 0
                              ) ? "#e2aeaaff" :
                                (keyDict[`${brandDict[items[0].brandId]?.brand ||
                                  items[0].brand}-${items[0].style}-${key}-${selectedColor}`]?.quantity > val
                                ) ? "#f1d7a9ff" :
                                  selectedSize === key ? "#e8e8e8" : "#f0f0f0",
                          }}
                        >
                          {val}
                        </div>
                      </div>
                    )
                  )}
              </div>
            </div>
            {selectedSize && (
              <>
                <div
                  style={{ color: "gray" }}
                  className={styles.discreetButton}
                  onClick={() => setAddReservation(!addReservation)}
                >
                  Add to existing reservation?{" "}
                </div>
                <div
                  className={`${styles.addToReservation} ${addReservation ? styles.heightTransitionMax : styles.heightTransitionMin}`}
                >
                  <div className={styles.reservationOptions}>
                    <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
                      Select Reservation:
                    </div>

                    {reservations
                      .filter((r) => r.status !== "complete")
                      .map((reservation, index) => (
                        <div
                          className={styles.reservation}
                          onMouseEnter={(e) => onMouseMoveIn(e, index)}
                          onMouseLeave={() => setReservationHover(null)}
                          onClick={() => setSelectedReservation(index)}
                          style={{
                            backgroundColor:
                              selectedReservation === index
                                ? "#a6a6a6"
                                : "rgb(245, 245, 245)",
                          }}
                        >
                          {reservation.sequentialId.toString().padStart(5, "0")}
                          {reservationHover === index && (
                            <div
                              className={styles.reservationPreview}
                              style={{ top: mouse[1], left: mouse[0] }}
                            >
                              <span style={{ fontWeight: "bold" }}>
                                Reservation Details:
                              </span>
                              <span>
                                <span style={{ fontWeight: "bold" }}>Id:</span>{" "}
                                {reservation.sequentialId
                                  .toString()
                                  .padStart(5, "0")}
                              </span>
                              <span>
                                <span style={{ fontWeight: "bold" }}>
                                  Order Title:
                                </span>{" "}
                                {reservation.orderTitle}
                              </span>
                              <span>
                                <span style={{ fontWeight: "bold" }}>
                                  Placed By:
                                </span>{" "}
                                {reservation.customer}
                              </span>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: "5px",
                                }}
                              >
                                <span style={{ fontWeight: "bold" }}>
                                  Status:
                                </span>{" "}
                                <div
                                  style={{
                                    height: "8px",
                                    width: "8px",
                                    borderRadius: "5px",
                                    backgroundColor:
                                      reservation.status === "Incomplete"
                                        ? "#eb726e"
                                        : "#e3d178",
                                  }}
                                ></div>
                                {reservation.status}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                  <div>
                    <div>
                      <span style={{ fontWeight: "bold", marginRight: "10px" }}>
                        Available Quantity:{" "}
                        {colorDict[selectedColor]?.items.reduce((a, b) => {
                          if (
                            (sizeDict[b.sizeId]?.size || b.size) ===
                            selectedSize
                          ) {
                            return a + b.quantity - (b.reserved || 0);
                          }
                          return a;
                        }, 0)}
                      </span>
                      { }
                    </div>
                    <div>
                      <span style={{ fontWeight: "bold", marginRight: "10px" }}>
                        Quantity:
                      </span>
                      <input
                        className={styles.reservationQuant}
                        type="number"
                        value={reservationQuantity}
                        onChange={(e) => setReservationQuantity(e.target.value)}
                        onBlur={() => {
                          if (!parseInt(reservationQuantity))
                            setReservationQuantity(0);
                          const maximum = colorDict[
                            selectedColor
                          ]?.items.reduce((a, b) => {
                            if (
                              (sizeDict[b.sizeId]?.size || b.size) ===
                              selectedSize
                            ) {
                              return a + b.quantity - (b.reserved || 0);
                            }
                            return a;
                          }, 0);
                          if (parseInt(reservationQuantity) > maximum)
                            setReservationQuantity(maximum);
                          else
                            setReservationQuantity(
                              parseInt(reservationQuantity)
                            );
                        }}
                      />
                    </div>
                    <button
                      className={styles.addToReservationButton}
                      onClick={addToReservation}
                      disabled={
                        submitting ||
                        selectedReservation == null ||
                        reservationQuantity <= 0
                      }
                    >
                      {submitting ? <BeatLoader size={6} /> : "Add"}
                    </button>
                  </div>
                </div>

                <div style={{ fontWeight: "bold" }}>
                  {
                    (colorDict[selectedColor]?.items.filter(
                      (item) =>
                        (sizeDict[item.sizeId]?.size || item.size) ===
                        selectedSize
                    )).length || "N/A"
                  }{" "}
                  boxes with item
                </div>
              </>
            )}

            <div
              className={`${styles.scrollableContainer} ${selectedSize ? styles.heightTransitionMax : styles.heightTransitionMin}`}
            >
              {selectedColor &&
                colorDict[selectedColor]?.items.map((item, index) => {
                  if (
                    (sizeDict[item.sizeId]?.size || item.size) === selectedSize
                  ) {
                    return (
                      <div
                        style={{
                          width: "200px",
                          cursor: "pointer",
                          position: "relative",
                        }}
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
                          Quantity: {item.quantity}
                        </div>
                        <div
                          style={{ height: "40px", position: "relative" }}
                          onMouseEnter={() => setBarHover(index)}
                          onMouseLeave={() => setBarHover(null)}
                        >
                          <div
                            style={{
                              width: "100%",
                              height: "10px",
                              position: "relative",
                              display: "flex",
                              flexDirection: "row",
                              gap: "0",
                              borderRadius: "10px",
                              overflow: "hidden",
                              marginTop: "15px",
                              boxShadow: "0 0 2px gray",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${((item.reserved || 0) / item.quantity) * 100}%`,
                                backgroundColor: "#e8b4b0",
                              }}
                            ></div>
                            <div
                              style={{
                                height: "100%",
                                width: `${(1 - (item.reserved || 0) / item.quantity) * 100}%`,
                                backgroundColor: "#93b597",
                              }}
                            ></div>
                          </div>

                          {barHover === index && (
                            <div
                              style={{
                                position: "absolute",
                                bottom: "0",
                                left: "0",
                                width: "fit-content",
                                backgroundColor: "white",
                                border: "1px solid gray",
                                padding: "5px",
                                borderRadius: "3px",
                                boxShadow: "0 0 5px rgba(0,0,0,0.2)",
                                zIndex: 1000,
                                pointerEvents: "none", // Prevents tooltip from interfering with hover
                              }}
                            >
                              <div>Quantity: {item.quantity}</div>
                              <div>
                                Unreserved:{" "}
                                {item.quantity - (item.reserved || 0)}
                              </div>
                              <div>Reserved: {item.reserved || 0}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return <></>;
                })}
              <div
                className={styles.groupImageContainer}
                style={{
                  width: "200px",
                  height: "200px",
                  cursor: "pointer",
                  position: "relative",
                  backgroundColor: "#f0eeeeff",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center"
                }}
                onClick={addToBox}
                >
                <IoAddSharp size={50} style={{ color: "#9f9e9eff" }} />
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
