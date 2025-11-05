"use client";
import { useEffect, useState } from "react";
import styles from "./companyInventory.module.css";
import AddItem from "./AddItem";
import EditItem from "./EditItem"
import Popup from "@/app/components/popups/Popup";
import ProductCard from "./ProductCard";

export default function CompanyInventory() {
  const [inventory, setInventory] = useState([]);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editItemOpen, setEditItemOpen] = useState(null)
  const [popup, setPopup] = useState(null)
  const [companies, setCompanies] = useState([])

  const [filter, setFilter] = useState("line items")

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    const response = await fetch("/api/companyInventory", {
      method: "GET",
    });
    const result = await response.json();
    setInventory(result.data);
  };


  useEffect(() => {
    const companySet = {}
    inventory.forEach((item) => {
      if(!companySet[item.company[0]._id]){
        companySet[item.company[0]._id] = [item]
      }
      else companySet[item.company[0]._id].push(item)
    })
    setCompanies(Object.values(companySet))

  }, [inventory])

  return (
    <>
    <div className={styles.page}>
      {popup && <Popup closePopup={() => setPopup(null)} popupType={popup} />}
      <button
      className={`${styles.button} ${styles.buttonAbsolute}`} onClick={() => setAddItemOpen(true)}>Add item</button>
      <div className={styles.pageSelection}>
          <div
            style={{
              display: "flex",
              gap: "10px",
              fontWeight: "bold",
              color: "black",
            }}
          >
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
                value="grouped"
                checked={filter === "grouped"}
                onChange={() => setFilter("grouped")}
              />{" "}
              Company View
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
                value="line items"
                checked={filter === "line items"}
                onChange={() => setFilter("line items")}
              />{" "}
              Line Items
            </label>
          </div>
        </div>
      {filter === "line items" && <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr style={{backgroundColor: "#c5ced9" }}>
              <th>Image</th>
              <th>Company</th>
              <th>Item Type</th>
              <th>Material</th>
              <th>Color</th>
              <th>Quantity</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item, index) => (
              <tr
                key={item._id || index} 
                style={{
                  backgroundColor: index % 2 === 0 ? "#dde4ed" : "#c5ced9",
                }}
                onClick={() => setEditItemOpen(item)}
              >
                <td className={styles.imageContainer}>
                  <img src={item.image} className={styles.image} style={{width:"3rem"}}/>
                </td>
                <td>{item.company[0].company}</td>
                <td>{item.type}</td>
                <td>{item.material}</td>
                <td>{item.color}</td>
                <td>
                  {item.productDetails.reduce((a, b) => a + b.quantity, 0)}
                </td>
                <td>
                  {item.productDetails.reduce(
                    (a, b) => (a !== b.location ? "Multi" : b.location),
                    item.productDetails[0].location
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
      {
        filter === "grouped" && 
        <div className={styles.companyGrid}>
          {companies.map((company) => 
             <ProductCard company={company} setEditItemOpen={setEditItemOpen}/>
          )}
        </div>
      }

    </div>
    {
        addItemOpen && 
        <AddItem onClose={() => setAddItemOpen(false)} inventory={inventory} setPopupOuter={setPopup} refresh={fetchInventory}/>
    }
    {
       editItemOpen !== null && 
        <EditItem item={editItemOpen} onClose={() => setEditItemOpen(null)} inventory={inventory} setPopupOuter={setPopup} refresh={fetchInventory}/>
    }
    </>
  );
}
