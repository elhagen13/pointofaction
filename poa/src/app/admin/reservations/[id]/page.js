"use client";
import { useState, useEffect, useMemo, useRef} from "react";
import React from "react"
import styles from "./reserve.module.css";
import { FiShoppingBag } from "react-icons/fi";
import { Fis } from "aws-sdk";
import SetQuantity from "./SetQuantity";
import Cart from "./Cart"
import { IoCart, IoSearch, IoChevronDown,  } from "react-icons/io5";

function Inventory({params}) {
  const { id } = React.use(params);
  const [selectedItem, setSelectedItem] = useState(null)

  const [reservation, setReservation] = useState(null)
  const [cart, setCart] = useState(null)

  const [inventory, setInventory] = useState([]);
  const [boxes, setBoxes] = useState([]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [searchValue, setSearchValue] = useState("");
  const searchOptions = [
    "all",
    "style code",
    "brand style",
    "color",
    "description",    
  ];
  const [selectedSearchOption, setSelectedSearchOption] = useState("all");

  const [cartOpen, setCartOpen] = useState(false)

  const [options, setOptions] = useState({});



  useEffect(() => {
    getInventory();
    getReservation();
    getItemOptions();
  }, []);


  
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

    setOptions({
      ...options,
      brands: resultBrands.data,
      sizes: resultSizes.data,
      descriptions: resultDescriptions.data,
    });
  };

  useEffect(() => {
    console.log("options", options);
  }, [options]);

  const contentDict = useMemo(() => {
    const dict = {};
    inventory.forEach((item) => {
      dict[item._id.toString()] = item
    });
    return dict;
  }, [inventory]);



  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const sizeDict = useMemo(() => {
    const dict = {};
    if (!options.sizes) return {};
    options.sizes.forEach((item) => {
      dict[item._id.toString()] = item;
    });
    return dict;
  }, [options]);

  const descriptionDict = useMemo(() => {
    if (!options.descriptions) return {};
    const dict = {};
    options.descriptions.forEach((item) => {
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

  useEffect(() => {
    if(!reservation || Object.keys(contentDict).length <= 0) return
    let reserved = []
    for(const item of reservation.items){
      reserved.push(contentDict[item.itemId.toString()])
    }
    console.log("reserved", reserved)
    let dict = {}
    console.log(brandDict)
    for (const item of reserved) {
      const style = item.style.toLowerCase();
      const color = item.color.toLowerCase();
      const brand = item.brand?.toLowerCase() || brandDict[item.brandId]?.brand.toLowerCase() || "N/A";
      const size = item.size?.toLowerCase() || sizeDict[item.sizeId]?.size.toLowerCase() || "N/A"
      const key = `${style}, ${color}, ${brand}, ${size}`;

      console.log(reservation.items.find(res => res.itemId === item._id))
      const prevItem = reservation.items.find(res => res.itemId === item._id)
      const quantity = prevItem.quantReserved
      console.log(prevItem)
      const pulled = prevItem.pulled || 0

      
      if (!dict[key]) {
        dict[key] = {
          brand: item.brand || brandDict[item.brandId]?.brand || "N/A",
          color: item.color,
          description: item.description || descriptionDict[item.descriptionId]?.description || "N/A",
          image: item.image,
          price: item.price,
          quantity: quantity,
          pulled: pulled,
          size: item.size || sizeDict[item.sizeId]?.size || "N/A",
          style: item.style,
        };
      }
      else{
        dict[key].quantity += quantity
        dict[key].pulled += pulled
      }
    }
    console.log(Object.values(dict))
    setCart(Object.values(dict))

  }, [reservation, contentDict, sizeDict, descriptionDict, brandDict])
  const handleOptionSelect = (option) => {
    setSelectedSearchOption(option);
    setIsDropdownOpen(false);
  };


  const filteredInventory = useMemo(() => {
    let items = inventory;

    // First, group the items (before filtering)
    let dict = {};
    for (const item of items) {
      const style = item.style.toLowerCase();
      const color = item.color.toLowerCase();
      const brand = item.brand?.toLowerCase() || brandDict[item.brandId]?.brand.toLowerCase() || "N/A"
      const key = `${style}, ${color}, ${brand}`;

      if (!dict[key]) {
        dict[key] = [item];
      } else {
        dict[key].push(item);
      }
    }

    const groupedItems = Object.values(dict);

    // Now filter the groups based on search criteria
    if (searchValue.trim() === "") {
      return groupedItems;
    }

    const searchTerm = searchValue.toLowerCase().trim();

    return groupedItems.filter((group) => {
      // Check if ANY item in the group matches the search
      return group.some((item) => {
        if (selectedSearchOption !== "all") {
          // Keep existing single-field search logic
          switch (selectedSearchOption) {
            case "style code":
              return item.style?.toLowerCase().includes(searchTerm);
            case "brand style":
              // Check both direct brand and brandId reference
              const brandText =
                item.brandId && brandDict[item.brandId.toString()]
                  ? brandDict[item.brandId.toString()].brand
                  : item.brand || "";
              return brandText.toLowerCase().includes(searchTerm);
            case "color":
              return item.color?.toLowerCase().includes(searchTerm);
            case "description":
              // Check both direct description and descriptionId reference
              const descriptionText =
                item.descriptionId &&
                descriptionDict[item.descriptionId.toString()]
                  ? descriptionDict[item.descriptionId.toString()].description
                  : item.description || "";
              return descriptionText.toLowerCase().includes(searchTerm);
            case "quantity":
              return item.quantity?.toString().includes(searchTerm);
            default:
              return false;
          }
        }

        // For "all" search - multi-word logic
        const searchWords = searchTerm
          .toLowerCase()
          .split(/\s+/)
          .filter((word) => word.length > 0);

        if (searchWords.length === 0) return true;

        // Combine all searchable text for this item (handling referenced fields)
        const brandText =
          item.brandId && brandDict[item.brandId.toString()]
            ? brandDict[item.brandId.toString()].brand
            : item.brand || "";
        const descriptionText =
          item.descriptionId && descriptionDict[item.descriptionId.toString()]
            ? descriptionDict[item.descriptionId.toString()].description
            : item.description || "";

        const itemText = [
          item.style || "",
          brandText,
          item.color || "",
          descriptionText,
          item.quantity?.toString() || "",
          boxDict[item.boxId?.toString()]?.boxId || "",
          boxDict[item.boxId?.toString()]?.location || "",
        ]
          .join(" ")
          .toLowerCase();

        // Check if ALL search words are found in the combined text
        return searchWords.every((word) => itemText.includes(word));
      });
    });
  }, [
    inventory,
    searchValue,
    selectedSearchOption,
    boxDict,
    brandDict,
    descriptionDict,
  ]);



  const getInventory = async () => {
    const response = await fetch("/api/inventory/item", {
      method: "GET",
    });

    const result = await response.json();

    setInventory(result.data);
  };

  const getReservation = async () => {
    const response = await fetch(`/api/catalog/reservation/${id}`, {
      method: "GET",
    });

    const result = await response.json();

    setReservation(result.data[0]);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 >Editing Contents of Reservation {reservation?.sequentialId.toString().padStart(5, "0") || ""}</h2>
      <div style={{display:"flex", justifyContent:"space-between", margin:"20px 0 10px 0"}}>
      <div className={styles.searchContainer} ref={dropdownRef}>
          <IoSearch className={styles.search} />
          <input
            className={styles.searchInput}
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
            }}
            placeholder={`Search ${selectedSearchOption === "all" ? "everything" : selectedSearchOption}...`}
          />
          <div
            className={styles.searchOption}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {selectedSearchOption}
            <IoChevronDown
              className={`${styles.chevron} ${isDropdownOpen ? styles.open : ""}`}
            />
          </div>

          {isDropdownOpen && (
            <div className={`${styles.dropdown} ${styles.searchDropdown}`}>
              {searchOptions.map((option, index) => (
                <div
                  key={index}
                  className={`${styles.dropdownItem} ${selectedSearchOption === option ? styles.selected : ""}`}
                  onClick={() => handleOptionSelect(option)}
                >
                  {option}
                </div>
              ))}
            </div>
          )}
        </div>
        <IoCart onClick={() => setCartOpen(true)} style={{fontSize:"40px", color:"#2563EB", cursor:"pointer"}}/>
      </div>
      <div className={styles.productGrid}>
        {filteredInventory.map((grouping, index) => {
          const representative = grouping[0];
          return (
            <div key={index} className={styles.productCard} onClick={() => setSelectedItem(grouping)}>
              <div style={{width:"100%", backgroundColor:"white"}}><img
                style={{objectFit:"contain"}}
                src={representative.image}
                className={styles.productImage}
              ></img>
              </div>
              <div className={styles.productCardDescription}>
                <div>Style #: {representative.style}</div>
                <div>
                  Brand:{" "}
                  {representative.brand ||
                    brandDict[representative.brandId]?.brand ||
                    "N/A"}
                </div>
                <div>Color: {representative.color}</div>
                <div>
                  Description:{" "}
                  {representative.description ||
                    descriptionDict[representative.descriptionId]?.description}
                </div>
              </div>
              <div style={{width:"100%", display:"flex", justifyContent:"end", padding:"20px", paddingTop: "0"}}>
                <div className={styles.shoppingButton}>
                    <FiShoppingBag/>
                    Add
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {selectedItem && <SetQuantity onClose={() => setSelectedItem(null)} items={selectedItem} sizeDict={sizeDict} brandDict={brandDict} descriptionDict={descriptionDict} cart={cart} setCart={setCart}/>}
      {cartOpen && <Cart onClose={() => setCartOpen(false)} brandDict={brandDict} descriptionDict={descriptionDict} fullInventory={inventory} refresh={getInventory} cart={cart} setCart={setCart}/>}
    </div>
  );
}

export default Inventory;
