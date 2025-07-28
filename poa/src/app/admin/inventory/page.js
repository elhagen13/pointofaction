"use client";
import { useState, useEffect, useMemo } from "react";
import styles from "./inventory.module.css";
import { FaRegEdit, FaUpload, FaTimes, FaRegCopy, FaEye} from "react-icons/fa";
import { FaRegSquarePlus } from "react-icons/fa6";
import { MdPublic,  MdOutlinePublicOff } from "react-icons/md";
import { HiCash } from "react-icons/hi";

import AddItem from "./AddItem.js";
import EditItem from "./EditItem.js";
import EditBox from "./EditBox.js";


function Inventory() {
  /*"all inventory", "boxes", "public", "sale"*/
  const [page, setPage] = useState("all inventory");
  const pageOptions = ["all inventory", "public", "sale"];
  const [filter, setFilter] = useState("line items");
  const colors = ["#BDCE67", "#93A537", "#6B7B15"];

  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editItemOpen, setEditItemOpen] = useState(null);
  const [editBoxOpen, setEditBoxOpen] = useState(null)

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


  const getInventory = async () => {
    const response = await fetch("/api/inventory/item", {
      method: "GET",
    });

    const result = await response.json();

    setInventory(result.data);
  };

  async function duplicateBox(box) {
    try {
      const boxData = {
        imageLink: box.image,
        location: box.location,
        qrCode: box.qrCode,
        description: box.description,
        ...(box.discount && {discount: box.discount}),
        ...(box.minPrice && {minPrice: box.minPrice})
      }
  
      // Create the box first
      const boxResponse = await fetch("/api/inventory/box", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(boxData),
      });
  
      const data = await boxResponse.json();
      
      if (!data.success) {
        console.error("Error creating box:", data.error);
        console.error("Details:", data.details);
        alert("Error creating box: " + (data.error || "Unknown error"));
        return false;
      }
  
      console.log("Box created successfully:", data.data);
      console.log("Message:", data.message);
  
      // Fix: Use a separate fetch for getting content
      const contentResponse = await fetch("/api/inventory/item", {  // Changed endpoint
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      const contentData = await contentResponse.json();  // Fix: Use contentResponse instead of boxResponse
      let contents = []
      
      // Fix: Use === for comparison and convert both to string for safety
      contentData.data.forEach((item) => {
        if(item.boxId.toString() === box._id.toString()){  // Fix: Use original box._id and strict equality
          contents.push(item)
        }
      })
  
      const boxId = data.data._id
  
      for (const content of contents) {
        const itemData = {
          box_id: boxId,
          image: content.image,
          description: content.description,
          style: content.style,
          size: content.size,
          color: content.color,
          quantity: content.quantity,
          price: content.price,
          sale: content.sale || false,  
          public: content.public || false 
        };
  
        const itemResponse = await fetch("/api/inventory/item", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(itemData),
        });
  
        const itemResult = await itemResponse.json();
        
        if (itemResult.success) {
          console.log("Item created successfully:", itemResult.data);
          console.log("Message:", itemResult.message);
        } else {
          console.error("Error creating item:", itemResult.error);
          console.error("Details:", itemResult.details);
          alert("Error creating item: " + (itemResult.error || "Unknown error"));
          return false;
        }
      }
  
      alert("Box and all items created successfully!");
      
      getInventory();
      
      return true;
  
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: " + error.message);
      return false;
    }
  }

  return (
    <div
      style={{
        width: "100%",
        padding: "30px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        color: "black"
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
              <th>Style</th>
              <th>Color</th>
              <th>Description</th>
              <th>Quantity</th>
              <th>Box</th>
              <th>Location</th>
              <th>Price</th>
              <th>Visibility</th>
              <></>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item, index) => (
              <tr key={index} style={{backgroundColor: index % 2 == 0 ? "#ebebeb" : "#f2f2f2"}}>
                <td className={styles.tableSm} style={{ position: "relative" }}>
                  <img src={item.image} alt={`Item ${index + 1}`} />
                </td>
                <td>{item.style}</td>
                <td>{item.color}</td>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>{boxDict[item.boxId.toString()]?.boxId || "No box"}</td>
                <td>{boxDict[item.boxId.toString()]?.location}</td>
                <td>${item.price}</td>
                <td>{item.public ? <MdPublic color="green"/> : <MdOutlinePublicOff color="red"/>}  {item.sale ? <HiCash color="blue"/> : <></>}</td>
                <td><FaEye onClick={() => setEditItemOpen(item)} style={{cursor:"pointer"}}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {page === "all inventory" && filter === "boxes" && (
        <table className={styles.inventoryTable} style={{borderCollapse:"collapse"}}>
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {boxes.map((box, index) => (
              <tr key={index} style={{backgroundColor: index % 2 == 0 ? "#ebebeb" : "#f2f2f2", cursor:"pointer"}}>
                <td className={styles.tableSm} style={{ position: "relative" }} onClick={() => setEditBoxOpen(box)}>
                  <img src={box.image} alt={`Item ${index + 1}`} />
                </td>
                <td onClick={() => setEditBoxOpen(box)}>{box.boxId}</td>
                <td onClick={() => setEditBoxOpen(box)}>{box.description}</td>
                <td onClick={() => setEditBoxOpen(box)}>{box.location}</td>
                <td onClick={() => setEditBoxOpen(box)}>
                  {contentDict[box._id.toString()]?.length || 0}
                </td>
                <td onClick={() => setEditBoxOpen(box)}>{contentDict[box._id][0].sale ? "Yes" : "No"}</td>
                <td onClick={() => setEditBoxOpen(box)}>{contentDict[box._id][0].sale ? `${box.discount}%` : "N/A"}</td>
                <td onClick={() => setEditBoxOpen(box)}>{contentDict[box._id][0].sale ? `$${box.minPrice}` : "N/A"}</td>
                <td><FaRegCopy onClick={() => duplicateBox(box)}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {addItemOpen && (
        <AddItem onClose={() => setAddItemOpen(false)} refresh={getInventory} />
      )}
      {editItemOpen !== null &&  (
        <EditItem item={editItemOpen} onClose={() => setEditItemOpen(null)} refresh={getInventory} />
      )}
       {editBoxOpen !== null &&  (
        <EditBox box={editBoxOpen} onClose={() => setEditBoxOpen(null)} refresh={getInventory} />
      )}
    </div>
  );
}

export default Inventory;