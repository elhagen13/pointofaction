"use client";
import { useState, useEffect, useMemo } from "react";
import styles from "./inventory.module.css";
import { FaRegEdit, FaUpload, FaTimes, FaRegTrashAlt } from "react-icons/fa";
import { FaRegSquarePlus } from "react-icons/fa6";
import AddItem from "./AddItem.js"

function Inventory() {
  /*"all inventory", "boxes", "public", "sale"*/
  const [page, setPage] = useState("inventory");
  const pageOptions = ["all inventory", "boxes", "public", "sale"];
  const colors = ["#BDCE67", "#93A537", "#6B7B15", "#455200"];

  const [addItemOpen, setAddItemOpen] = useState(false)

  

  return (
    <div style={{ width: "100%", padding: "30px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className={styles.pageSelection}>
        <button className={styles.button} onClick={() => setAddItemOpen(true)}>Add Item</button>
      </div>
      <div className={styles.pageSelection}>
        {pageOptions.map((opt, index) => (
          <div style={{ backgroundColor: colors[index] }}>{opt}</div>
        ))}
      </div>

      {addItemOpen && <AddItem onClose={() => setAddItemOpen(false)}/>}
    </div>
  );
}

export default Inventory;
