"use client";
import Overlay from "@/app/components/popups/Overlay";
import styles from "./reservation.module.css";
import { useEffect, useState, useMemo, useRef } from "react";
import { BeatLoader } from "react-spinners";
import ProgressBar from "./ProgressBar";
import { FiDownload, FiEdit } from "react-icons/fi";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { IoWarning } from "react-icons/io5";
import jsPDF from "jspdf";
import { autoTable } from 'jspdf-autotable'





export default function Reservation({ onClose, reservation }) {
  {
    console.log(reservation);
  }
  return (
    <Overlay onClose={onClose} isVisible={true}>
      <Order reservation={reservation} />
    </Overlay>
  );
}

const Order = ({ reservation }) => {
  let stage = "incomplete";
  const [status, setStatus] = useState(reservation.status);
  const [reservationItems, setReservationItems] = useState([]);
  const [deletedItems, setDeletedItems] = useState([])
  const [loading, setLoading] = useState(true);
  const [reservationDict, setReservationDict] = useState({});
  const [options, setOptions] = useState({});
  const [boxes, setBoxes] = useState([]);

  const [originalOrderTitle, setOriginalOrderTitle] = useState(reservation.orderTitle || "");
  const [originalSoIn, setOriginalSoIn] = useState(reservation.soIn || "");
  const [orderTitle, setOrderTitle] = useState(reservation.orderTitle || "");
  const [soIn, setSoIn] = useState(reservation.soIn || "");
  const [submitting, setSubmitting] = useState(false)
  console.log(reservation)

  useEffect(() => {
    checkCompleteness();
    fetchReservationItems();
    getItemOptions();
    getBoxes();
  }, []);

  useEffect(() => {
    let dict = {};
    for (const item of reservation.items) {
      dict[item.itemId] = {
        quantReserved: item.quantReserved || 0,
        pulled: item.pulled || 0,
      };
    }
    setReservationDict(dict);
    console.log("DICT",)

    for (const item of reservationItems) {
      dict[item._id]["id"] = item._id;
    }
  }, [reservationItems]);



  const refresh = () => {
    getReservation();
  };

  const getReservation = async () => {
    const fetchReservation = await fetch(
      `/api/catalog/reservation/${reservation._id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const result = await fetchReservation.json();
  };

  const getItemOptions = async () => {
    let response = await fetch("/api/details/brands", {
      method: "GET",
    });
    let resultBrands = await response.json();

    response = await fetch("/api/details/sizes", {
      method: "GET",
    });
    let resultSizes = await response.json();

    response = await fetch("/api/details/descriptions", {
      method: "GET",
    });
    let resultDescriptions = await response.json();

    response = await fetch("/api/details/common", {
      method: "GET",
    });
    let resultCombos = await response.json();

    console.log(resultDescriptions);

    setOptions({
      ...options,
      brands: resultBrands.data,
      sizes: resultSizes.data,
      descriptions: resultDescriptions.data,
      combos: resultCombos.data,
    });
  };

  const sizeDict = useMemo(() => {
    const dict = {};
    if (!options.sizes) return {};
    options.sizes.forEach((item) => {
      dict[item._id.toString()] = item;
    });
    return dict;
  }, [options]);

  const brandDict = useMemo(() => {
    if (!options.brands) return {};
    const dict = {};
    options.brands.forEach((item) => {
      dict[item._id.toString()] = item;
    });
    return dict;
  }, [options]);

  const boxDict = useMemo(() => {
    const dict = {};
    boxes.forEach((box) => {
      dict[box._id.toString()] = box;
    });
    return dict;
  }, [boxes]);

  const getBoxes = async () => {
    const response = await fetch("/api/inventory/box", {
      method: "GET",
    });

    const result = await response.json();
    setBoxes(result.data);
  };

  const checkCompleteness = (currentDict = reservationDict) => {
    let complete = 0;
    let partial = 0;
    let none = 0;

    Object.keys(currentDict).forEach((itemId) => {
      const item = currentDict[itemId];
      if ((item.pulled === 0 || !item.pulled) && item.quantReserved > 0)
        none += 1;
      else if (item.pulled > 0 && item.pulled < item.quantReserved)
        partial += 1;
      else complete += 1;
    });

    const totalItems = Object.keys(currentDict).length;
    const newStatus =
      complete === totalItems
        ? "Complete"
        : none === totalItems
          ? "Incomplete"
          : "In Progress";

    if (newStatus !== status) {
      updateReservation(newStatus);
      setStatus(newStatus);
    }
    return [newStatus, complete];
  };

  useEffect(() => {
    if (Object.keys(reservationDict).length > 0) {
      checkCompleteness(reservationDict);
    }
  }, [reservationDict]);

  const updateReservation = async (newStatus) => {
    await fetch(`/api/catalog/reservation/${reservation._id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: newStatus,
      }),
    });
  };

  const editReservation = async () => {
    setSubmitting(true)
    const result = await fetch(`/api/catalog/reservation/${reservation._id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        soIn: soIn,
        orderTitle: orderTitle
      }),
    });
    console.log(result)


    if (result.ok) {
      setOriginalOrderTitle(orderTitle);
      setOriginalSoIn(soIn);
    }
    else {
      alert("Error updating fields")
    }
    setSubmitting(false)
  };


  const fetchReservationItems = async () => {

    //gets all inventory items that have an Id that is included in the reservation
    //if an inventory item has been deleted it should present the default options that were
    //put in on the creation of the reservation which were the current descriptors at time of 
    //creation
    const result = await fetch("/api/catalog", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        itemIds: reservation.items.map((item) => item.itemId),
      }),
    });


    if (result.ok) {
      const body = await result.json();

      let deleted = []
      for (const item of reservation.items) {
        console.log(item)
        if (!body.data.find((i) => i._id === item.itemId)) {
          deleted.push(item)
        }
      }
      setDeletedItems(deleted)
      console.log(deleted)
      setReservationItems(body.data);
      setLoading(false);
      console.log(body.data);
    }
    return;
  };

  const downloadReservation = () => {
    try {
      const pdf = new jsPDF();
      pdf.setFont(undefined, 'bold')
      pdf.text(`Reservation ${reservation.sequentialId}`, 15, 15)

      let resList = []
      for(const item of reservationItems){
        resList.push([
          brandDict[item.brandId].brand || item.brand || "No brand", 
          item.style || "No style", 
          item.color || "No color",
          sizeDict[item.sizeId].size|| item.size || "No brand",
          item.quantity || "0 - Item pulled",
          boxDict[item.boxId].boxId || "N/A",
          boxDict[item.boxId].location || "N/A",


        ])
      }

      autoTable(pdf, {
        head: [["Brand", "Color", "Style", "Size", "Quantity", "Box #", "Location"]], 
        body: resList,
        startY: 20
      })

    
      pdf.save(`table.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  }

  return (
    <div>
      <div className={styles.progressBarContainer}>
        <ProgressBar
          steps={reservationItems.length || 0}
          stepsComplete={checkCompleteness()[1]}
        />
      </div>
      <div className={styles.tableContainer} style={{ marginTop: "30px" }}>
        <table className={styles.reservationItemTable}>
          <thead>
            <tr style={{ backgroundColor: "#c5ced9" }}>
              <th style={{ padding: "10px" }}>Order #</th>
              <th>Order Title</th>
              <th>Customer Id</th>
              <th>Status</th>
              <th>SO#/In#</th>
              <th>Purchase Date</th>
              <th>Last Edited</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ backgroundColor: "#dde4ed" }}>
              <td style={{ padding: "10px" }}>
                {reservation.sequentialId?.toString().padStart(5, "0")}
              </td>
              <td><input className={styles.dropdownButton} value={orderTitle} onChange={(e) => setOrderTitle(e.target.value)} /></td>
              <td>{reservation.customer}</td>
              <td>
                <div
                  className={styles.dropdownButton}
                  style={{ border: "none", width: "fit-content" }}
                >
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "10px",
                      cursor: "default",
                      backgroundColor:
                        checkCompleteness()[0] === "Incomplete"
                          ? "#db8e86"
                          : checkCompleteness()[0] === "Complete"
                            ? "#aad99e"
                            : "#e0d28b",
                    }}
                  />
                  {checkCompleteness()[0]}
                </div>
              </td>
              <td><input className={styles.dropdownButton} value={soIn} onChange={(e) => setSoIn(e.target.value)} /></td>
              <td>{new Date(reservation.createdAt).toLocaleString()}</td>
              <td>{new Date(reservation.updatedAt).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
        {(soIn !== originalSoIn || orderTitle !== originalOrderTitle) &&
          <button className={styles.save} disabled={submitting} onClick={editReservation}>{submitting ? <BeatLoader size={7} /> : "Save Changes"}
          </button>}
      </div>

      {loading && (
        <div
          className={styles.progressBarContainer}
          style={{ marginTop: "20px" }}
        >
          <BeatLoader />
        </div>
      )}
      {!loading && (
        <>
          <div className={styles.edit}>
            <button className={styles.downloadButton} onClick={downloadReservation}>Download <FiDownload /></button>
            <Link href={`/admin/reservations/${reservation._id}`}>
              <button className={styles.editButton}>Edit <FiEdit /></button>
            </Link>
          </div>
          <div className={styles.tableContainer}>
            <table className={styles.reservationItemTable}>
              <thead>
                <tr style={{ backgroundColor: "#c5ced9" }}>
                  <th style={{ padding: "10px" }}>Item</th>
                  <th>Style</th>
                  <th>Brand</th>
                  <th>Color</th>
                  <th>Size</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Box #</th>
                  <th>Location</th>
                  <th>Last Edited</th>
                </tr>
              </thead>
              <tbody>
                {reservationItems.map((item, index) => (
                  <tr
                    style={{
                      backgroundColor: index % 2 === 0 ? "#dde4ed" : "#c5ced9",
                    }}
                  >
                    <td>
                      <div className={styles.imageContainer}>
                        <img src={item.image}></img>
                      </div>
                    </td>
                    <td>{item.style}</td>
                    <td>
                      {item.brand || brandDict[item.brandId]?.brand || "N/A"}
                    </td>
                    <td>{item.color}</td>
                    <td>{item.size || sizeDict[item.sizeId]?.size || "N/A"}</td>
                    <td>
                      <Quantity
                        reservation={reservation}
                        item={reservationDict[item._id]}
                        itemStr={`${brandDict[item.brandId]?.brand || item.brand || "No Brand"} ${item.color} ${sizeDict[item.sizeId]?.size || item.size || "No Size"} ${item.style}`}
                        setDict={setReservationDict}
                        dict={reservationDict}
                        prev={reservationDict[item._id].pulled}
                        max={reservationDict[item._id].quantReserved - reservationDict[item._id].pulled}
                        checkCompleteness={checkCompleteness}
                        refresh={refresh}
                      />
                    </td>
                    <td>
                      <Status
                        reservation={reservation}
                        item={reservationDict[item._id]}
                        setDict={setReservationDict}
                        dict={reservationDict}
                        prev={reservationDict[item._id].pulled}
                        max={reservationDict[item._id].quantReserved}
                        checkCompleteness={checkCompleteness}
                        refresh={refresh}
                      />
                    </td>
                    <td>{boxDict[item.boxId]?.boxId || "N/A"}</td>
                    <td>
                      {item.location || boxDict[item.boxId]?.location || "N/A"}
                    </td>
                    <td>{new Date(item.updatedAt).toLocaleString()}</td>
                  </tr>
                ))}
                {deletedItems.map((item, index) => (
                  <tr
                    style={{
                      backgroundColor: index % 2 === 0 ? "#dde4ed" : "#c5ced9",
                    }}
                  >
                    <td>
                      <div className={styles.imageContainer}>
                        <img src={item.image}></img>
                      </div>
                    </td>
                    <td>{item.style}</td>
                    <td>
                      {item.brand || brandDict[item.brandId]?.brand || "N/A"}
                    </td>
                    <td>{item.color}</td>
                    <td>{item.size || "N/A"}</td>
                    <td>
                      <Quantity
                        reservation={reservation}
                        item={reservationDict[item.itemId]}
                        itemStr={`${brandDict[item.brandId]?.brand || item.brand || "No Brand"} ${item.color} ${sizeDict[item.sizeId]?.size || item.size || "No Size"} ${item.style}`}
                        setDict={setReservationDict}
                        dict={reservationDict}
                        prev={reservationDict[item.itemId].pulled}
                        max={reservationDict[item.itemId].quantReserved - reservationDict[item.itemId].pulled}
                        checkCompleteness={checkCompleteness}
                        refresh={refresh}
                      />
                    </td>
                    <td>
                      <Status
                        reservation={reservation}
                        item={reservationDict[item.itemId]}
                        setDict={setReservationDict}
                        dict={reservationDict}
                        prev={reservationDict[item.itemId].pulled}
                        max={reservationDict[item.itemId].quantReserved}
                        checkCompleteness={checkCompleteness}
                        refresh={refresh}
                      />
                    </td>
                    <td>{item.boxId || "N/A"}</td>
                    <td>
                      {item.location || boxDict[item.boxId]?.location || "N/A"}
                    </td>
                    <td>
                      <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: "20px" }}>
                        N/A
                        <IoWarning size={20} style={{ color: "#AD2B10", cursor: "pointer" }} title="Item has since been removed from inventory, details reflect state at time of creation." />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

const Quantity = ({ reservation, item, itemStr, setDict, dict, prev, max }) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const dropdownRef = useRef(null);
  const [value, setValue] = useState(max);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownVisible(false);
      }
    }

    if (dropdownVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownVisible]);

  const validate = () => {
    if (isNaN(value)) setValue(prev);
    else setValue(Math.min(parseInt(value), parseInt(max)));
  };

  const saveChanges = async () => {
    setSubmitting(true);
    validate();
    console.log(item);

    let change = {
      user: user.fullName,
      editedOn: new Date(),
      changes: [`${value} ${itemStr} pulled for reservation ${reservation.sequentialId}`],
    };

    const result = await fetch(
      `/api/catalog/reservation/${reservation._id}/${item.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newAmount: value,
          history: change
        }),
      }
    );

    if (result.ok) {
      const body = await result.json();
      console.log("orig", dict);

      setDict((prevDict) => {
        const revisedDict = {
          ...prevDict,
          [item.id]: {
            ...prevDict[item.id],
            pulled: value + prev,
          },
        };

        return revisedDict;
      });

      setSubmitting(false);
      setDropdownVisible(false);
    } else {
      console.error("Failed to update:", result.status);
      setSubmitting(false);
    }
  };


  return (
    <div ref={dropdownRef}>
      <div
        className={styles.dropdownButton}
        onClick={() => setDropdownVisible(!dropdownVisible)}
      >
        {item.pulled} / {item.quantReserved} pulled
      </div>
      {dropdownVisible && (
        <div className={styles.dropdown}>
          <div>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={validate}
              max={max}
              className={styles.numPulled}
            />{" "}
            pulled
          </div>
          <button
            className={styles.confirm}
            onClick={saveChanges}
            disabled={submitting}
          >
            {submitting ? <BeatLoader size={6} /> : "Confirm Changes"}
          </button>
        </div>
      )}
    </div>
  );
};

const Status = ({ item }) => {
  let status = "Incomplete";
  if (item.quantReserved === item.pulled) status = "Complete";
  else if (item.pulled === 0) status = "Incomplete";
  else status = "In Progress";

  return (
    <div>
      <div
        className={styles.dropdownButton}
        style={{ border: "none", width: "fit-content", cursor: "default" }}
      >
        <div
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "10px",
            backgroundColor:
              status === "Incomplete"
                ? "#db8e86"
                : status === "Complete"
                  ? "#aad99e"
                  : "#e0d28b",
          }}
        />
        {status}
      </div>
    </div>
  );
};
