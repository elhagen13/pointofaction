"use client";
import styles from "./inventory.module.css";
import { useState, useEffect, useMemo } from "react";
import {
  FaUpload,
  FaTimes,
  FaRegTrashAlt,
  FaLink,
  FaBookmark,
  FaDownload,
  FaRegCopy,
  FaPlus,
} from "react-icons/fa";
import {
  IoIosAddCircle,
  IoIosRemoveCircle,
  IoIosCheckmarkCircle,
} from "react-icons/io";
import jsPDF from "jspdf";

export default function MultiOpen({
  items,
  onClose,
  setEditBoxOpen,
  setEditItemOpen,
  boxDict,
  sizeDict,
  descriptionDict,
  brandDict,
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

  return (
    <div className={styles.overlayBackground} onClick={handleOverlayClick}>
      <div className={styles.addItem} onClick={handleModalClick} style={{width:"100%", display: "flex", flexDirection:"column", gap:"20px"}}>
        <h2>
          Matching inventory: {items[0].color}{" "}{items[0].brand || brandDict[items[0].brandId].brand}{" "}
          {items[0].size || sizeDict[items[0].sizeId].size} {items[0].style}
        </h2>
        <h3 style={{ color: "gray" }}>{items.length} results found</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, 300px)",
            gap: "20px",
            marginTop: "30px",
          }}
        >
          {items.map((item) => (
            <div
              onClick={() => {
                onClose();
                item.boxId ? setEditBoxOpen(boxDict[item.boxId]) : setEditItemOpen(item)
            }}
              style={{
                gridColumn: "span 1",
                boxShadow: "0 0 4px gray",
                padding: "10px",
                borderRadius: "10px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <img
                src={item.image}
                style={{ width: "100%", objectFit: "contain" }}
              ></img>
              <h4>Box #: {item.boxId ? boxDict[item.boxId].boxId : ""}</h4>
              <h4>
                Location:{" "}
                {item.location ? item.location : boxDict[item.boxId].location}
              </h4>
              <h4>Quantity Remaining: {item.quantity}</h4>
              <h4 style={{color:"gray"}}>
                Description:{" "}
                {item.description ||
                  descriptionDict[item.descriptionId].description}
              </h4>
              <h4 style={{color:"gray"}}>Brand: {item.brand || (brandDict[item.brandId] ? brandDict[item.brandId].brand : "N/A")}</h4>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
