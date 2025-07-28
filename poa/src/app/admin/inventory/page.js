"use client";
import { useState, useEffect, useMemo } from "react";
import styles from "./inventory.module.css";
import { FaRegEdit, FaUpload, FaTimes, FaRegTrashAlt} from "react-icons/fa";
import { FaRegSquarePlus } from "react-icons/fa6";
import { MdPublic,  MdOutlinePublicOff } from "react-icons/md";
import { HiCash } from "react-icons/hi";

import AddItem from "./AddItem.js";

function Inventory() {
  /*"all inventory", "boxes", "public", "sale"*/
  const [page, setPage] = useState("all inventory");
  const pageOptions = ["all inventory", "public", "sale"];
  const [filter, setFilter] = useState("line items");
  const colors = ["#BDCE67", "#93A537", "#6B7B15"];

  const [addItemOpen, setAddItemOpen] = useState(false);

  const [inventory, setInventory] = useState([]);
  const [boxes, setBoxes] = useState([]);

  useEffect(() => {
    const getBoxes = async () => {
      const response = await fetch("/api/inventory/box", {
        method: "GET",
      });

      const result = await response.json();
      setBoxes(result.data);
    };

    getBoxes();
  }, [inventory]);

  useEffect(() => {
    getInventory();
  }, []);

  const getInventory = async () => {
    const response = await fetch("/api/inventory/item", {
      method: "GET",
    });

    const result = await response.json();

    setInventory(result.data);
  };

  // Fix: Use useMemo to create contentDict properly
  const contentDict = useMemo(() => {
    const dict = {};
    inventory.forEach(item => {
      if (item.boxId) {
        const boxIdStr = item.boxId.toString();
        if (!dict[boxIdStr]) {
          dict[boxIdStr] = [];
        }
        dict[boxIdStr].push(item);
      }
    });
    return dict;
  }, [inventory]);

  const boxDict = useMemo(() => {
    const dict = {};
    boxes.forEach((box) => {
      dict[box._id.toString()] = box;
    });
    return dict;
  }, [boxes]);

  return (
    <div
      style={{
        width: "100%",
        padding: "30px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <div className={styles.pageSelection}>
        <button className={styles.button} onClick={() => setAddItemOpen(true)}>
          Add Item
        </button>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: "20px", fontWeight: "bold" }}>
          <label
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "5px",
              alignItems: "center",
            }}
          >
            <input
              type="radio"
              name="filterType"
              value="line items"
              checked={filter === "line items"}
              onChange={() => setFilter("line items")}
            />{" "}
            Line Items
          </label>
          <label
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "5px",
              alignItems: "center",
            }}
          >
            <input
              type="radio"
              name="filterType"
              value="boxes"
              checked={filter === "boxes"}
              onChange={() => setFilter("boxes")}
            />
            Boxes
          </label>
        </div>
        <div className={styles.pageSelection}>
          {pageOptions.map((opt, index) => (
            <div key={index} style={{ backgroundColor: colors[index] }}>{opt}</div>
          ))}
        </div>
      </div>
      {page === "all inventory" && filter === "line items" && (
        <table className={styles.inventoryTable} style={{borderCollapse:"collapse"}}>
          <thead style={{ textAlign: "left" }}>
            <tr>
              <th className={styles.tableSm}>Item</th>
              <th>id</th>
              <th>Description</th>
              <th>Style</th>
              <th>Color</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Visibility</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item, index) => (
              <tr key={index} style={{backgroundColor: index % 2 == 0 ? "#ebebeb" : "#f2f2f2"}}>
                <td className={styles.tableSm} style={{ position: "relative" }}>
                  <img src={item.image} alt={`Item ${index + 1}`} />
                </td>
                <td>{boxDict[item.boxId.toString()]?.boxId || "No box"}</td>
                <td>{item.description}</td>
                <td>{item.style}</td>
                <td>{item.color}</td>
                <td>{item.quantity}</td>
                <td>${item.price}</td>
                <td>{item.public ? <MdPublic color="green"/> : <MdOutlinePublicOff color="red"/>}  {item.sale ? <HiCash color="blue"/> : <></>}</td>

              </tr>
            ))}
          </tbody>
        </table>
      )}
      {page === "all inventory" && filter === "boxes" && (
        <table className={styles.inventoryTable}>
          <thead style={{ textAlign: "left" }}>
            <tr>
              <th className={styles.tableSm}>Box</th>
              <th>Box Id</th>
              <th>Description</th>
              <th>Location</th>
              <th>Content Quantity</th>
              <th>Sale</th>
              <th>Discount</th>
              <th>Min Purchase</th>
            </tr>
          </thead>
          <tbody>
            {boxes.map((box, index) => (
              <tr key={index}>
                <td className={styles.tableSm} style={{ position: "relative" }}>
                  <img src={box.image} alt={`Item ${index + 1}`} />
                </td>
                <td>{box.boxId}</td>
                <td>{box.description}</td>
                <td>{box.location}</td>
                <td>
                  {contentDict[box._id.toString()]?.length || 0}
                </td>
                <td>{box.discount ? "Yes" : "No"}</td>
                <td>{box.discount ? `${box.discount}%` : "N/A"}</td>
                <td>{box.minPrice ? `$${box.minPrice}` : "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {addItemOpen && (
        <AddItem onClose={() => setAddItemOpen(false)} refresh={getInventory} />
      )}
    </div>
  );
}

export default Inventory;