"use client";
import { useState, useEffect } from "react";
import React from "react";
import styles from "./reservation.module.css";
import { BeatLoader } from "react-spinners";
import { RiArrowGoBackLine } from "react-icons/ri";
import AddToRes from "./AddToRes";

export default function Reservation({ params }) {
  const { id } = React.use(params);
  const [reservation, setReservation] = useState({});
  const [editReservation, setEditReservation] = useState(null);
  const [returnReservation, setReturnReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState([]);
  const [quantityAvailable, setQuantityAvailable] = useState(0);
  const [idSet, setIdSet] = useState({});
  const [quantityMap, setQuantityMap] = useState({});
  const [allocatedRemaining, setAllocatedRemaining] = useState(0);
  const [total, setTotal] = useState(0);
  const [groupedItems, setGroupedItems] = useState([]);
  const [returnQuantities, setReturnQuantities] = useState({});
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [add, setAdd] = useState(false);
  const [existingKeys, setExistingKeys] = useState([]);
  const [addedItems, setAddedItems] = useState([]);

  const getReservation = async () => {
    const response = await fetch(`/api/catalog/reservation/${id}`, {
      method: "GET",
    });
    const result = await response.json();
    console.log(result.data);
    setReservation(result.data[0]);

    // Build idSet for all items
    const ids = {};
    for (const item of result.data[0].items) {
      ids[item.itemId] = item;
    }
    setIdSet(ids);

    // Group items by style, color, brand, and size
    const groups = {};
    result.data[0].items.forEach((item) => {
      console.log(item);
      const size =
        item.size || item.currentItemData?.sizeData?.size || "Unknown Size";
      const brand =
        item.brand || item.currentItemData?.brandData?.brand || "Unknown Brand";
      const description =
        item.currentItemData?.descriptionData?.description ||
        item.description ||
        "Unknown Description";
      console.log("DESCRIPTION", description);

      const style =
        item.style || item.currentItemData?.style || "Unknown Style";
      const color =
        item.color || item.currentItemData?.color || "Unknown Color";

      const key = `${style}-${color}-${brand}-${size}`;

      if (!groups[key]) {
        groups[key] = {
          key,
          style,
          color,
          brand,
          size,
          description,
          items: [],
          totalReserved: 0,
          totalPulled: 0,
          image: item.image || item.currentItemData?.image,
        };
      }

      groups[key].items.push(item);
      groups[key].totalReserved += item.quantReserved;
      groups[key].totalPulled += item.pulled || 0;
    });

    setGroupedItems(Object.values(groups));
  };

  useEffect(() => {
    getReservation();
  }, []);

  const getMatching = async (style, color, brand, size) => {
    setLoading(true);
    try {
      const matching = await fetch(
        `/api/catalog?style=${style}&color=${color}&brand=${brand}&size=${size}&ignore=true`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!matching.ok) {
        const errorData = await matching.json();
        throw new Error(errorData.error || `HTTP ${matching.status}`);
      }
      const data = await matching.json();
      console.log("Matching items:", data);

      let map = {};
      for (const opt of data) {
        map[opt._id] = idSet[opt._id]
          ? idSet[opt._id]?.quantReserved - (idSet[opt._id]?.pulled || 0)
          : 0;
      }
      console.log("Initial MAP", map);

      setQuantityMap(map);
      setOptions(data);
      setQuantityAvailable(
        data.reduce(
          (a, b) => a + (b.quantity - (!idSet[b._id] ? b.reserved || 0 : 0)),
          0
        )
      );
      setLoading(false);
      return;
    } catch (finalizeError) {
      console.error("Error finalizing reservation:", finalizeError);
      return null;
    }
  };

  const changeBoxes = (group, index) => {
    console.log("GROUP", group);
    setReturnReservation(null);
    setEditReservation(index === editReservation ? null : index);
    getMatching(group.style, group.color, group.brand, group.size);
    setTotal(group.totalReserved - group.totalPulled);
  };

  const returnToBox = (group, index) => {
    setEditReservation(null);
    setReturnReservation(index === returnReservation ? null : index);
    const returned = {};
    group.items.forEach((item) => (returned[item.itemId] = item.pulled || 0));
    console.log("RETURNED", returned);
    setReturnQuantities(returned);
  };

  const getDescription = (group) => {
    console.log(group);
    return `${group.size} ${group.color} ${group.brand} ${group.description} ${group.style}`;
  };

  const getAvailableQuantity = (opt) => {
    if (idSet[opt._id]) {
      return (
        opt.quantity -
        opt.reserved +
        idSet[opt._id].quantReserved -
        (idSet[opt._id].pulled || 0)
      );
    }
    return opt.quantity - (opt.reserved || 0);
  };

  const handleCardChange = (id, e) => {
    let revisedQuantityMap = { ...quantityMap };
    revisedQuantityMap[id] = parseInt(e.target.value);
    setQuantityMap(revisedQuantityMap);
  };

  useEffect(() => {
    console.log("Quantity map updated:", quantityMap);
    const remaining =
      total -
      Object.values(quantityMap).reduce(
        (a, b) => a + (isNaN(b) || !b ? 0 : parseInt(b)),
        0
      );
    console.log("Remaining:", remaining);
    setAllocatedRemaining(remaining);
  }, [quantityMap, total]);

  const handleSubmit = async () => {
    if (editReservation === null) return;

    const currentGroup = groupedItems[editReservation];
    console.log("Current group:", currentGroup);
    console.log("Quantity map:", quantityMap);

    // Build the quantities object with only changed items
    const quantities = quantityMap;

    // For each item in the current group, update its quantity based on quantityMap
    for (const item of currentGroup.items) {
      const allocatedQty = parseInt(quantityMap[item.itemId]) || 0;
      console.log(allocatedQty);
      if (allocatedQty !== item.quantReserved) {
        quantities[item.itemId] = allocatedQty;
      }
    }

    console.log("Quantities to update:", quantities);

    if (Object.keys(quantities).length === 0) {
      alert("No changes to save");
      return;
    }

    try {
      const response = await fetch(`/api/catalog/manual/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantities }),
      });

      if (!response.ok) {
        throw new Error("Failed to update reservation");
      }

      const result = await response.json();
      console.log("Update result:", result);

      // Refresh the reservation
      await getReservation();
      setEditReservation(null);
      alert("Reservation updated successfully!");
    } catch (error) {
      console.error("Error updating reservation:", error);
      alert("Failed to update reservation");
    }
  };

  const validateNumericInput = () => {
    let values = {};
    Object.entries(returnQuantities).forEach(([key, quant], index) => {
      console.log(key, quant, index);
      values[key] = parseInt(quant) || 0;
    });
    setReturnQuantities(values);
  };

  const returnToBoxSubmit = async (itemId) => {
    if (submittingReturn) return;
    setSubmittingReturn(true);
    try {
      const response = await fetch(`/api/catalog/manual/${id}/return`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId: itemId,
          returnedQuantity: returnQuantities[itemId],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update reservation");
      }

      const result = await response.json();
      console.log("Update result:", result);

      // Refresh the reservation
      await getReservation();
      setReturnReservation(null);
      alert("Reservation updated successfully!");
    } catch (error) {
      console.error("Error updating reservation:", error);
      alert("Failed to update reservation");
    }
    setSubmittingReturn(false);
  };

  useEffect(() => {
    if (!groupedItems || groupedItems.length === 0) return;

    // Flatten all items from grouped items
    const arr1 = groupedItems.flatMap(
      (group) =>
        group.items?.map(
          (item) => `${item.brand}-${item.style}-${item.color}`
        ) || []
    );

    // Map added items
    const arr2 =
      addedItems?.map((item) => `${item.brand}-${item.style}-${item.color}`) ||
      [];

    setExistingKeys(arr1.concat(arr2));
  }, [groupedItems, addedItems]);

  const checkDisabled = () => {
    if (allocatedRemaining != 0) return true;

    for (const opt of options) {
      if (getAvailableQuantity(opt) < quantityMap[opt._id]) {
        return true;
      }
    }

    return false;
  };

  return (
    <div className={styles.page}>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2>Reservation {reservation.sequentialId} </h2>
        <div className={styles.addToRes} onClick={() => setAdd(!add)}>
          Add Item
        </div>
      </span>
      {add && (
        <AddToRes
          existingKeys={existingKeys}
          addedItems={addedItems}
          setAddedItems={setAddedItems}
          reservationId={id}
          onSuccess={() => {
            getReservation();
            setAdd(false);
          }}
        />
      )}
      <div className={styles.grid}>
        {groupedItems.map((group, index) => (
          <div key={group.key} className={styles.cardWrapper}>
            <div className={styles.card}>
              <div className={styles.imageContainer}>
                <img src={group.image} className={styles.image} alt="item" />
              </div>
              {getDescription(group)}
              <div className={styles.buttonContainer}>
                <div className={styles.button}>
                  {group.totalReserved} reserved
                </div>
                <div
                  className={`${styles.button} ${styles.pulled} ${
                    returnReservation === index && styles.selectedPulled
                  }`}
                  onClick={() => returnToBox(group, index)}
                >
                  {group.totalPulled} pulled
                </div>
                <div
                  className={`${styles.button} ${styles.remaining} ${
                    editReservation === index && styles.selected
                  }`}
                  onClick={() => changeBoxes(group, index)}
                >
                  {group.totalReserved - group.totalPulled} remaining
                </div>
              </div>
            </div>

            {editReservation === index && (
              <div className={styles.editCardContainer}>
                {loading ? (
                  <div className={styles.loading}>
                    <BeatLoader />
                  </div>
                ) : (
                  <div className={styles.editCard}>
                    <div className={styles.apart}>
                      <span>
                        Quantity (Max {quantityAvailable}):{" "}
                        <input
                          className={styles.input}
                          type="number"
                          min="0"
                          max={quantityAvailable}
                          value={total}
                          onChange={(e) => setTotal(e.target.value)}
                        />{" "}
                      </span>
                      {isNaN(allocatedRemaining) ? "~" : allocatedRemaining}{" "}
                      remaining
                    </div>
                    <div className={styles.options}>
                      {options.map((opt) => (
                        <div key={opt._id} className={styles.boxCards}>
                          <span>
                            {opt.boxSequentialId
                              ? `#${opt.boxSequentialId}`
                              : "No Box"}
                          </span>
                          <span>Available: {getAvailableQuantity(opt)}</span>
                          <div>
                            Taking:{" "}
                            <input
                              className={styles.input}
                              value={quantityMap[opt._id] || 0}
                              type="number"
                              min="0"
                              max={getAvailableQuantity(opt)}
                              onChange={(e) => handleCardChange(opt._id, e)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={checkDisabled()}
                      className={`${styles.remaining} ${styles.saveButton}`}
                    >
                      save
                    </button>
                  </div>
                )}
              </div>
            )}
            {returnReservation === index && (
              <div className={styles.editCardContainer}>
                <div className={styles.table}>
                  {group.items
                    .filter((item) => item.pulled && item.pulled > 0)
                    .map((item, index) => (
                      <div key={index} className={styles.row}>
                        <span>
                          Return{" "}
                          <input
                            className={styles.input}
                            type="number"
                            max={item.pulled || 0}
                            value={returnQuantities[item.itemId]}
                            onChange={(e) =>
                              setReturnQuantities({
                                ...returnQuantities,
                                [item.itemId]: e.target.value,
                              })
                            }
                            onBlur={validateNumericInput}
                          />{" "}
                          (max {item.pulled || 0}) to box{" "}
                          {item.currentItemData?.boxData?.boxId}
                        </span>
                        <div
                          className={styles.returnButton}
                          onClick={() => returnToBoxSubmit(item.itemId)}
                        >
                          <RiArrowGoBackLine />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
