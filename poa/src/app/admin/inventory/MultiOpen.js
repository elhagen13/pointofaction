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
  const [boxTotals, setBoxTotals] = useState({});

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const getTotal = async (id) => {
    if (!id) return 0;
    
    try {
      const response = await fetch(`/api/inventory/box/${id}`, {
        method: "GET",
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data?.reduce((a, b) => a + (b.quantity || 0), 0) || 0;
    } catch (error) {
      console.error(`Error fetching total for box ${id}:`, error);
      return 0;
    }
  };

  // Fetch totals for all unique box IDs
  useEffect(() => {
    const uniqueBoxIds = [...new Set(items.map(item => item.boxId).filter(Boolean))];
    
    const fetchTotals = async () => {
      const totals = {};
      
      for (const boxId of uniqueBoxIds) {
        totals[boxId] = await getTotal(boxId);
      }
      
      setBoxTotals(totals);
    };

    if (uniqueBoxIds.length > 0) {
      fetchTotals();
    }
  }, [items]);

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
          Matching inventory: {items[0]?.color}{" "}
          {items[0]?.brand || brandDict[items[0]?.brandId]?.brand}{" "}
          {items[0]?.size || sizeDict[items[0]?.sizeId]?.size} {items[0]?.style}
        </h2>
        <h3 style={{ color: "gray" }}>{items.length} results found</h3>
        <div
          style={{display:"flex", flexDirection:"column", gap:"20px"}}
        >
          
          {items.map((item, index) => (
            <div
              key={item.id || index} // Use item.id if available, otherwise index
              onClick={() => {
                onClose();
                item.boxId ? setEditBoxOpen(boxDict[item.boxId]) : setEditItemOpen(item)
              }}
              style={{
                width:"100%",
                height:"100px",
                boxShadow: "0 0 4px gray",
                padding: "10px",
                borderRadius: "10px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "row",
                gap: "30px",
                alignItems:"center"
              }}
            >
              <img
                src={item.image}
                alt={`${item.color} ${item.style}`}
                style={{ height:"100%", objectFit: "contain" }}
              />
              <h4>
                Box #: {item.boxId ? boxDict[item.boxId]?.boxId : "No box"}
              </h4>
              <h4>
                Location:{" "}
                {item.location || boxDict[item.boxId]?.location || "N/A"}
              </h4>
              <h4 style={{marginLeft:"auto"}}>Quantity Remaining: {item.quantity}</h4>
              <h4>
                Box Total: {item.boxId ? (boxTotals[item.boxId] ?? "Loading...") : "N/A"}
              </h4>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}