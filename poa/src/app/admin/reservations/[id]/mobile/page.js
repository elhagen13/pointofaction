"use client";
import React from "react";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { IoIosCheckmarkCircle } from "react-icons/io";
import { useUser } from "@clerk/nextjs";
import { BeatLoader } from "react-spinners";
import Popup from "@/app/components/popups/Popup";

export default function MobileReservation({ params }) {
  const { id } = React.use(params);
  const [reservation, setReservation] = useState({});
  const [boxMap, setBoxMap] = useState({});
  const [selectedBox, setSelectedBox] = useState(null);
  const [itemDict, setItemDict] = useState({});

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [movedIndex, setMovedIndex] = useState(null);

  const { user } = useUser();

  const [changes, setChanges] = useState({});
  const [committedChanges, setCommittedChanges] = useState({});

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const minSwipeDistance = 50;

  useEffect(() => {
    getReservation();
  }, []);

  const getReservation = async () => {
    const fetchReservation = await fetch(`/api/catalog/reservation/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const result = await fetchReservation.json();

    setReservation(result.data[0]);
    let tempDict = { "No Box": [] };
    let tempItemDict = {};
    console.log("RESERVATION", result.data[0]);
    result.data[0].items.forEach((item) => {
      tempItemDict[item.itemId] = item?.currentItemData || item;
      changes[item.itemId] = item.quantReserved - (item.pulled || 0);
      if (!item.currentItemData.boxData) {
        tempDict["No Box"].push(item);
      } else {
        if (!tempDict[item.currentItemData.boxData.boxId])
          tempDict[item.currentItemData.boxData.boxId] = [];
        tempDict[item.currentItemData.boxData.boxId].push(item);
      }
    });
    setItemDict(tempItemDict);
    setBoxMap(tempDict);
  };

  const getDescription = (item) => {
    return `${item.size || item.sizeData.size || "No Size"} 
    ${item.color} ${item.brand || item.brandData.brand || "No Brand"}
    ${item.description || item.descriptionData.description || "No Description"} ${item.style}`;
  };

  const onTouchStart = (e) => {
    console.log(1);
    e.preventDefault();
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = (e, index) => {
    e.preventDefault();
    console.log(2);
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isRightSwipe) setMovedIndex(null);
    if (isLeftSwipe) setMovedIndex(index);
  };

  useEffect(() => {
    console.log(committedChanges);
  }, [committedChanges]);

  const commitChanges = async (index) => {
    setSubmitting(true);
    let promises = Object.entries(committedChanges[index]).map(
      ([id, change]) => {
        console.log(id, change, itemDict);
        let history = {
          user: user.fullName,
          editedOn: new Date(),
          changes: [
            `${change} ${getDescription(itemDict[id])} pulled for reservation ${reservation.sequentialId}`,
          ],
        };
        console.log(history);
        return fetch(`/api/catalog/reservation/${reservation._id}/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newAmount: change,
            history: history,
          }),
        });
      }
    );

    try {
      // Wait for both promises to resolve concurrently
      const results = await Promise.all(promises);
      console.log(results);
      if (results.some((result) => !result.ok)) {
        throw Error("One save failed");
      }
      getReservation();
      setCommittedChanges({});
      setSuccess(true);
    } catch (error) {
      setError(true);
      console.error("One of the fetches failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <h2>Pulling for Reservation {reservation.sequentialId}</h2>
      {boxMap &&
        Object.entries(boxMap).map(([key, value], index) => (
          <>
            {value.length > 0 && (
              <div
                className={styles.row}
                onClick={() => {
                  setSelectedBox(selectedBox == index ? null : index);
                  setMovedIndex(null);
                }}
              >
                <span className={styles.rowDescriptor}>
                  <img
                    src={value[0]?.currentItemData?.boxData?.image || "https://companystores.s3.us-east-1.amazonaws.com/gallery-images/Frame+45.png"}
                    className={styles.boxImage}
                  ></img>
                  <h2>{key}</h2>
                </span>
                {value.every((item) => item.quantReserved == item.pulled) && (
                  <div className={`${styles.checkmark} ${styles.confirmed}`}>
                    <IoIosCheckmarkCircle
                      size={25}
                      onClick={() => {
                        setCommittedChanges({
                          ...committedChanges,
                          [index]: {
                            ...committedChanges[index],
                            [item.itemId]: Math.max(
                              0,
                              Math.min(
                                changes[item.itemId],
                                item.quantReserved - (item.pulled || 0)
                              )
                            ),
                          },
                        });
                      }}
                    />
                  </div>
                )}
                {committedChanges[index] &&
                  Object.entries(committedChanges[index]).length > 0 && (
                    <button
                      className={styles.button}
                      onClick={() => commitChanges(index)}
                      disabled={submitting}
                    >
                      {submitting ? <BeatLoader size={7} /> : "Commit Changes"}
                    </button>
                  )}
              </div>
            )}
            <div
              className={`${styles.selectedBox} ${selectedBox == index && styles.visible}`}
            >
              <div className={styles.visibleContainer}>
                {value.map((item, rowIndex) => (
                  <div className={styles.rowContainer}>
                    <div
                      className={styles.subRow}
                      onTouchStart={onTouchStart}
                      onTouchMove={onTouchMove}
                      onTouchEnd={(e) => onTouchEnd(e, rowIndex)}
                      onClick={() =>
                        movedIndex === rowIndex
                          ? setMovedIndex(null)
                          : setMovedIndex(rowIndex)
                      }
                      style={{
                        position: "relative",
                        zIndex: 1,
                        transform:
                          rowIndex === movedIndex && index == selectedBox
                            ? "translateX(-70%)"
                            : "translateX(0)",
                        transition: "transform 0.3s ease",
                      }}
                    >
                      {getDescription(item.currentItemData)}
                      <span className={styles.quantity}>
                        {!(
                          committedChanges[index] &&
                          committedChanges[index][item.itemId]
                        ) ? (
                          item.quantReserved - (item.pulled || 0)
                        ) : (
                          <div style={{ display: "flex", gap: "10px" }}>
                            <span
                              style={{
                                textDecoration: "line-through",
                                color: "#969696ff",
                              }}
                            >
                              {item.quantReserved - (item.pulled || 0)}
                            </span>
                            <span>
                              {item.quantReserved -
                                (item.pulled || 0) -
                                committedChanges[index][item.itemId]}
                            </span>
                          </div>
                        )}
                      </span>
                    </div>
                    <div className={styles.hiddenRow}>
                      <div className={styles.pullContainer}>
                        Pull
                        <input
                          className={styles.input}
                          value={changes[item.itemId]}
                          onClick={() => {
                            committedChanges[index] &&
                              committedChanges[index][item.itemId] &&
                              delete committedChanges[index][item.itemId];
                          }}
                          onChange={(e) =>
                            setChanges({
                              ...changes,
                              [item.itemId]: e.target.value,
                            })
                          }
                          onBlur={() => {
                            setChanges({
                              ...changes,
                              [item.itemId]: Math.max(
                                0,
                                Math.min(
                                  changes[item.itemId],
                                  item.quantReserved - (item.pulled || 0)
                                )
                              ),
                            });
                          }}
                        />
                        <div
                          className={`${styles.checkmark} ${committedChanges[index] && committedChanges[index][item.itemId] && styles.confirmed}`}
                        >
                          <IoIosCheckmarkCircle
                            size={25}
                            onClick={() => {
                              changes[item.itemId] !== 0 && setCommittedChanges({
                                ...committedChanges,
                                [index]: {
                                  ...committedChanges[index],
                                  [item.itemId]: Math.max(
                                    0,
                                    Math.min(
                                      changes[item.itemId],
                                      item.quantReserved - (item.pulled || 0)
                                    )
                                  ),
                                },
                              });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ))}
      {error && (
        <Popup
          closePopup={() => setError(false)}
          popupType="customError"
          popupText="save failed, reload page and try again"
        />
      )}
      {success && (
        <Popup closePopup={() => setSuccess(false)} popupType="successSm" />
      )}
    </div>
  );
}
