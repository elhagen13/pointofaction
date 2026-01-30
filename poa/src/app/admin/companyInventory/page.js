"use client";
import { useEffect, useState, useMemo } from "react";
import styles from "./companyInventory.module.css";
import globals from "../globals.module.css"
import AddItem from "./AddItem";
import EditItem from "./EditItem";
import Popup from "@/app/components/popups/Popup";
import ProductCard from "./ProductCard";
import Image from "@/app/components/Image";
import { FaSearch } from "react-icons/fa";

export default function CompanyInventory() {
  const [inventory, setInventory] = useState([]);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editItemOpen, setEditItemOpen] = useState(null);
  const [popup, setPopup] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("")

  const [filter, setFilter] = useState("line items");

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
    const companySet = {};
    inventory.forEach((item) => {
      if (!companySet[item.company[0]._id]) {
        companySet[item.company[0]._id] = [item];
      } else companySet[item.company[0]._id].push(item);
    });
    setCompanies(Object.values(companySet));
    console.log(Object.values(companySet))
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    if(search == "") return inventory;
    const s = search.toLowerCase();
    return inventory.filter((item) => 
      item.company.find((company) => company.company.toLowerCase().includes(s)
      || item.name.toLowerCase().includes(s)
      || item.type.toLowerCase().includes(s)
      || item.material.toLowerCase().includes(s)
      || item.color.toLowerCase().includes(s)
  ))
  }, [search, inventory])

  const filteredCompanies = useMemo(() => {
    if(search == "") return companies;
    console.log(companies)
    const s = search.toLowerCase();
    return companies.filter((company) => 
    company.find((c) => c.company[0].company.toLowerCase().includes(s)))
  }, [search, companies])


  return (
    <>
      <div className={styles.page}>
        {popup && <Popup closePopup={() => setPopup(null)} popupType={popup} />}
        <button
          className={`${styles.button} ${styles.buttonAbsolute}`}
          onClick={() => setAddItemOpen(true)}
        >
          Add item
        </button>
        <div className={styles.modifierHeader}>
          <div className={styles.searchContainer}>
            <input className={styles.search} value={search} onChange={(e) => setSearch(e.target.value)}></input>
            <FaSearch className={styles.searchIcon}/>
          </div>
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
        </div>
        {filter === "line items" && (
            <table className={`${globals.table} ${globals.blue}`}>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Company</th>
                  <th>Name</th>
                  <th>Item Type</th>
                  <th>Material</th>
                  <th>Color</th>
                  <th>Quantity</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item, index) => (
                  <tr
                    key={item._id || index}
                    onClick={() => setEditItemOpen(item)}
                  >
                    <td className={globals.sm}>
                      <div className={globals.imageContainer}>
                      <Image
                        image={item.image}
                      />
                      </div>
                    </td>
                    <td>{item.company[0].company}</td>
                    <td>{item.name || "N/A"}</td>

                    <td>{item.type}</td>
                    <td>{item.material}</td>
                    <td>{item.color}</td>
                    <td>
                      {item.productDetails.reduce((a, b) => a + b.quantity, 0)}
                    </td>
                    <td>
                      {item.productDetails.reduce(
                        (a, b) => (a !== b.location ? "Multi" : b.location),
                        item.productDetails[0]?.location || 0
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        )}
        {filter === "grouped" && (
          <div className={styles.companyGrid}>
            {filteredCompanies.map((company) => (
              <ProductCard
                company={company}
                setEditItemOpen={setEditItemOpen}
              />
            ))}
          </div>
        )}
      </div>
      {addItemOpen && (
        <AddItem
          onClose={() => setAddItemOpen(false)}
          inventory={inventory}
          setPopupOuter={setPopup}
          refresh={fetchInventory}
        />
      )}
      {editItemOpen !== null && (
        <EditItem
          item={editItemOpen}
          onClose={() => setEditItemOpen(null)}
          inventory={inventory}
          setPopupOuter={setPopup}
          refresh={fetchInventory}
        />
      )}
    </>
  );
}
