"use client";
import styles from "./inventory.module.css";
import { useState, useEffect } from "react";
import {
  FaRegEdit,
  FaUpload,
  FaTimes,
  FaRegTrashAlt,
  FaLink,
  FaDownload,
} from "react-icons/fa";
import { FaRegSquarePlus } from "react-icons/fa6";
import { IoIosAddCircle, IoIosCheckmarkCircle } from "react-icons/io";
import jsPDF from "jspdf";

export default function EditItem({ item, onClose, refresh }) {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      refresh();
      onClose();
    }
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className={styles.overlayBackground} onClick={handleOverlayClick}>
      <div className={styles.addItem} onClick={handleModalClick}>
        <EditBox item={item} />
      </div>
    </div>
  );
}

const EditBox = ({ item }) => {
  const [description, setDescription] = useState(item.description || "N/A");
  const [boxNumber, setBoxNumber] = useState(item.boxNumber || "N/A");
  const [style, setStyle] = useState(item.style || "N/A");
  const [color, setColor] = useState(item.color || "N/A");
  const [quantity, setQuantity] = useState(item.quantity || "N/A");
  const [price, setPrice] = useState(item.price || "N/A")

  const [contents, setContents] = useState([])
  
  useEffect(() => {
    console.log("run")
    const getContent = async () => {
      const response = await fetch("/api/inventory/item", {
        method: "GET",
      });

      const result = await response.json();
      console.log(result.data)
      result.data.forEach((item) => {
        if(item.boxId == item._id){
          setContents([...contents, item])
        }
      })
    };

    getContent();
  }, []);

  useEffect(() => {
    console.log("hello", contents)
  }, [item])
  return (
    <div>
      <h2>Edit Item</h2>
      <div className={styles.formInput}>
        <label>Item Description</label>
        <input
          className={styles.input}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div className={styles.formInput}>
        <label>Box #</label>
        <input
          className={styles.input}
          value={boxNumber}
          onChange={(e) => setBoxNumber(e.target.value)}
          required
        />
      </div>
      <div>
      <div className={styles.formInput}>
        <label>Style</label>
        <input
          className={styles.input}
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          required
        />
      </div>
      <div className={styles.formInput}>
        <label>Color</label>
        <input
          className={styles.input}
          value={color}
          onChange={(e) => setColor(e.target.value)}
          required
        />
      </div>
      <div className={styles.formInput}>
        <label>Quantity</label>
        <input
          className={styles.input}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
      </div>
      </div>
      <div className={styles.formInput}>
        <label>Price</label>
        <input
          className={styles.input}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </div>
    </div>
  );
};
