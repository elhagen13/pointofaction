"use client";
import { useState, useEffect } from "react";
import React from "react";
import styles from "./alternativeReservation.module.css";
import { BeatLoader } from "react-spinners";
import { RiArrowGoBackLine } from "react-icons/ri";
import { useUser } from "@clerk/nextjs";
import { TruckElectric } from "lucide-react";

export default function AlternativeView({ res, refresh }) {
  const [reservation, setReservation] = useState(res);
  const [editReservation, setEditReservation] = useState(null);
  const [returnReservation, setReturnReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState([]);
  const [idSet, setIdSet] = useState({});
  const [quantityMap, setQuantityMap] = useState({});
  const [allocatedRemaining, setAllocatedRemaining] = useState(0);
  const [total, setTotal] = useState(0);
  const [groupedItems, setGroupedItems] = useState([]);
  const [returnQuantities, setReturnQuantities] = useState({});
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [submitting, setSubmitting] = useState(null);
  const { user } = useUser();

  useEffect(() => {
    setReservation(res);
  }, [res]);

  useEffect(() => {
    if(!reservation.items) return
    const ids = {};
    for (const item of reservation.items) {
      ids[item.itemId] = item;
    }
    setIdSet(ids);

    // Group items by style, color, brand, and size
    const groups = {};
    reservation.items.forEach((item) => {
      console.log(item);
      const size =
        item.size ||
        item.currentItemData?.sizeData?.size ||
        item.currentItemData?.size ||
        "Unknown Size";
      const brand =
        item.brand ||
        item.currentItemData?.brandData?.brand ||
        item.currentItemData?.brand ||
        "Unknown Brand";
      const description =
        item.currentItemData?.descriptionData?.description ||
        item.currentItemData?.description ||
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
  }, [reservation]);

  const changeBoxes = (group, index) => {
    setLoading(true);
    console.log("GROUP", group);
    setReturnReservation(null);
    setEditReservation(index === editReservation ? null : index);
    setTotal(group.totalReserved - group.totalPulled);
    setOptions(group.items);
    let map = {};
    for (const opt of group.items) {
      map[opt.itemId] = idSet[opt.itemId]
        ? idSet[opt.itemId]?.quantReserved - (idSet[opt.itemId]?.pulled || 0)
        : 0;
    }

    setQuantityMap(map);
    setLoading(false);
  };

  useEffect(() => {
    console.log(quantityMap, options);
  }, [quantityMap, options]);

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

  const handleSubmit = async (id, value, itemStr) => {
    console.log(id, value, itemStr);
    setSubmitting(id);

    let change = {
      user: user.fullName,
      editedOn: new Date(),
      changes: [
        `${value} ${itemStr} pulled for reservation ${reservation.sequentialId}`,
      ],
    };

    const result = await fetch(
      `/api/catalog/reservation/${reservation._id}/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newAmount: value,
          history: change,
        }),
      }
    );

    if (result.ok) {
      const body = await result.json();

      setSubmitting(null);
      setEditReservation(null);
      refresh();
    } else {
      console.error("Failed to update:", result.status);
      setSubmitting(null);
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
      const response = await fetch(
        `/api/catalog/manual/${reservation._id}/return`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            itemId: itemId,
            returnedQuantity: returnQuantities[itemId],
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update reservation");
      }

      const result = await response.json();
      console.log("Update result:", result);

      refresh();
      setReturnReservation(null);
    } catch (error) {
      console.error("Error updating reservation:", error);
      alert("Failed to update reservation");
    }
    setSubmittingReturn(false);
  };

  const checkDisabled = (opt) => {
    console.log("OPT", opt);
    if (quantityMap[opt.itemId] > opt.quantReserved - (opt.pulled || 0))
      return true;
    if (quantityMap[opt.itemId] <= 0) return true;
    return false;
  };

  return (
    <div className={styles.page}>
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
                    <div className={styles.options}>
                      {options.map((opt) => (
                        <div key={opt._id} className={styles.boxCards}>
                          <span>
                            {opt.currentItemData?.boxData?.boxId
                              ? `#${opt.currentItemData.boxData.boxId}`
                              : "No Box"}
                          </span>
                          <span>
                            Pulled: {idSet[opt.itemId].pulled || 0}/
                            {idSet[opt.itemId].quantReserved}
                          </span>
                          <div>
                            Taking:{" "}
                            <input
                              className={styles.input}
                              value={quantityMap[opt.itemId] || 0}
                              type="number"
                              min="0"
                              max={getAvailableQuantity(opt)}
                              onChange={(e) => handleCardChange(opt.itemId, e)}
                            />
                          </div>
                          <button
                            onClick={() =>
                              handleSubmit(
                                opt.itemId,
                                quantityMap[opt.itemId] || 0,
                                group.key
                              )
                            }
                            disabled={checkDisabled(opt)}
                            className={`${styles.remaining} ${styles.saveButton}`}
                          >
                            {submitting == opt.itemId ? (
                              <BeatLoader size={5} />
                            ) : (
                              "save"
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
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
