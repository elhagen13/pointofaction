"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import styles from "./inventory.module.css";
import { FaRegCopy, FaEye } from "react-icons/fa";
import { IoSearch, IoChevronDown, IoChevronUp } from "react-icons/io5";
import { MdPublic, MdOutlinePublicOff } from "react-icons/md";
import { HiCash } from "react-icons/hi";

import AddItem from "./AddItem.js";
import AddBox from "./AddBox.js";
import EditItem from "./EditItem.js";
import EditBox from "./EditBox.js";

function Inventory() {
  /*"all inventory", "boxes", "public", "sale"*/
  const [page, setPage] = useState("all inventory");
  const pageOptions = ["all inventory", "public", "sale"];
  const [filter, setFilter] = useState("line items");
  const colors = ["#BDCE67", "#93A537", "#6B7B15"];

  const [selectedItem, setSelectedItem] = useState(null);

  const [addBoxOpen, setAddBoxOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editItemOpen, setEditItemOpen] = useState(null);
  const [editBoxOpen, setEditBoxOpen] = useState(null);

  const [inventory, setInventory] = useState([]);
  const [boxes, setBoxes] = useState([]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const dropdownRef = useRef(null);
  const searchOptions = [
    "all",
    "style",
    "color",
    "description",
    "quantity",
    "box",
    "location",
  ];
  const [selectedSearchOption, setSelectedSearchOption] = useState("all");

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

  const contentDict = useMemo(() => {
    const dict = {};
    inventory.forEach((item) => {
      if (item.boxId) {
        const boxIdStr = item.boxId?.toString();
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

  // Filter inventory based on page selection
  const filteredInventory = useMemo(() => {
    let items;
    switch (page) {
      case "public":
        items = inventory.filter((item) => item.public === true);
        break;
      case "sale":
        items = inventory.filter((item) => item.sale === true);
        break;
      default: // "all inventory"
        items = inventory;
    }

    // Apply search filter
    if (searchValue.trim() === "") {
      return items;
    }

    const searchTerm = searchValue.toLowerCase().trim();

    return items.filter((item) => {
      if (selectedSearchOption !== "all") {
        // Keep existing single-field search logic
        switch (selectedSearchOption) {
          case "style":
            return item.style?.toLowerCase().includes(searchTerm);
          case "color":
            return item.color?.toLowerCase().includes(searchTerm);
          case "description":
            return item.description?.toLowerCase().includes(searchTerm);
          case "quantity":
            return item.quantity?.toString().includes(searchTerm);
          case "box":
            const boxId = boxDict[item.boxId?.toString()]?.boxId;
            return boxId?.toLowerCase().includes(searchTerm);
          case "location":
            const location = boxDict[item.boxId?.toString()]?.location;
            return location?.toLowerCase().includes(searchTerm);
        }
      }

      // For "all" search - multi-word logic
      const searchWords = searchTerm
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 0);

      if (searchWords.length === 0) return true;

      // Combine all searchable text for this item
      const itemText = [
        item.style || "",
        item.color || "",
        item.description || "",
        item.quantity?.toString() || "",
        boxDict[item.boxId?.toString()]?.boxId || "",
        boxDict[item.boxId?.toString()]?.location || "",
      ]
        .join(" ")
        .toLowerCase();

      // Check if ALL search words are found in the combined text
      return searchWords.every((word) => itemText.includes(word));
    });
  }, [inventory, page, searchValue, selectedSearchOption, boxDict]);

  // Filter boxes based on page selection and search
  const filteredBoxes = useMemo(() => {
    let boxItems;
    switch (page) {
      case "public":
        boxItems = boxes.filter((box) => {
          const contents = contentDict[box._id.toString()] || [];
          return contents.some((item) => item.public === true);
        });
        break;
      case "sale":
        boxItems = boxes.filter((box) => {
          const contents = contentDict[box._id.toString()] || [];
          return contents.some((item) => item.sale === true);
        });
        break;
      default: // "all inventory"
        boxItems = boxes;
    }

    // Apply search filter to boxes
    if (searchValue.trim() === "") {
      return boxItems;
    }

    const searchTerm = searchValue.toLowerCase().trim();

    return boxItems.filter((item) => {
      if (selectedSearchOption !== "all") {
        switch (selectedSearchOption) {
          case "style":
            return item.style?.toLowerCase().includes(searchTerm);
          case "color":
            return item.color?.toLowerCase().includes(searchTerm);
          case "description":
            return item.description?.toLowerCase().includes(searchTerm);
          case "quantity":
            return item.quantity?.toString().includes(searchTerm);
          case "box":
            const boxId = boxDict[item.boxId?.toString()]?.boxId;
            return boxId?.toLowerCase().includes(searchTerm);
          case "location":
            const location = boxDict[item.boxId?.toString()]?.location;
            return location?.toLowerCase().includes(searchTerm);
        }
      }
    
      // For "all" search - multi-word logic
      const searchWords = searchTerm.toLowerCase().split(/\s+/).filter(word => word.length > 0);
      
      if (searchWords.length === 0) return true;
    
      // Combine all searchable text for this item
      const itemText = [
        item.style || '',
        item.color || '',
        item.description || '',
        item.quantity?.toString() || '',
        boxDict[item.boxId?.toString()]?.boxId || '',
        boxDict[item.boxId?.toString()]?.location || ''
      ].join(' ').toLowerCase();
    
      // Check if ALL search words are found in the combined text
      return searchWords.every(word => itemText.includes(word));
    });
  }, [boxes, contentDict, page, searchValue, selectedSearchOption]);

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
        description: box.description,
        ...(box.discount && { discount: box.discount }),
        ...(box.minPrice && { minPrice: box.minPrice }),
      };

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
      const contentResponse = await fetch("/api/inventory/item", {
        // Changed endpoint
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const contentData = await contentResponse.json(); // Fix: Use contentResponse instead of boxResponse
      let contents = [];

      // Fix: Use === for comparison and convert both to string for safety
      contentData.data.forEach((item) => {
        if (item.boxId?.toString() === box._id.toString()) {
          // Fix: Use original box._id and strict equality
          contents.push(item);
        }
      });

      const boxId = data.data._id;

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
          public: content.public || false,
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
          alert(
            "Error creating item: " + (itemResult.error || "Unknown error")
          );
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

  const handleOptionSelect = (option) => {
    setSelectedSearchOption(option);
    setIsDropdownOpen(false);
  };

  return (
    <div
      style={{
        width: "100%",
        padding: "30px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        color: "black",
      }}
    >
      <div className={styles.pageSelection}>
        <button className={styles.button} onClick={() => setAddItemOpen(true)}>
          Add Item
        </button>
        <button className={styles.button} onClick={() => setAddBoxOpen(true)}>
          Add Box
        </button>
      </div>
      <div className={styles.filters}>
        <div className={styles.searchContainer} ref={dropdownRef}>
          <IoSearch className={styles.search} />
          <input
            className={styles.searchInput}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
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
            <div className={styles.dropdown}>
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
        <div className={styles.pageSelection}>
          <div
            style={{
              display: "flex",
              gap: "20px",
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
          {pageOptions.map((opt, index) => (
            <button
              key={index}
              onClick={() => setPage(opt)}
              style={{
                backgroundColor: page === opt ? colors[index] : "#f0f0f0",
                color: page === opt ? "white" : "black",
                border: "1px solid #ccc",
                padding: "8px 16px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      {filter === "line items" && (
        <table
          className={styles.inventoryTable}
          style={{ borderCollapse: "collapse", borderRadius: "10px", overflow:"hidden" }}
        >
          <thead style={{ textAlign: "left" }}>
            <tr style={{ backgroundColor: "#ebebeb" }}>
              <th className={styles.tableSm}>Item</th>
              <th>Style</th>
              <th>Color</th>
              <th>Description</th>
              <th>Quantity</th>
              <th>Box</th>
              <th>Location</th>
              <th>Price</th>
              <th>Visibility</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map((item, index) => (
              <tr
                key={index}
                style={{
                  backgroundColor: index % 2 == 0 ? "#f2f2f2" : "#ebebeb",
                }}
                onClick={() => {
                  if (boxDict[item.boxId?.toString()]) {
                    setSelectedItem(item._id);
                    setEditBoxOpen(boxDict[item.boxId?.toString()]);
                  } else {
                    setEditItemOpen(item);
                  }
                }}
              >
                <td className={styles.tableSm} style={{ position: "relative" }}>
                  <img src={item.image} alt={`Item ${index + 1}`} />
                </td>
                <td>{item.style}</td>
                <td>{item.color}</td>
                <td>
                  {item.description.length > 50
                    ? item.description.slice(0, 50) + "..."
                    : item.description}
                </td>
                <td>{item.quantity}</td>
                {boxDict[item.boxId?.toString()] ? (
                  <td
                    onClick={() =>
                      setEditBoxOpen(boxDict[item.boxId?.toString()])
                    }
                    style={{ cursor: "pointer" }}
                  >
                    {boxDict[item.boxId?.toString()]?.boxId}
                  </td>
                ) : (
                  <td>N/A</td>
                )}
                <td>
                  {boxDict[item.boxId?.toString()]?.location || item.location}
                </td>
                <td>${item.price}</td>
                <td>
                  {item.public ? (
                    <MdPublic color="green" />
                  ) : (
                    <MdOutlinePublicOff color="red" />
                  )}{" "}
                  {item.sale ? <HiCash color="blue" /> : <></>}
                </td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {filter === "boxes" && (
        <table
          className={styles.inventoryTable}
          style={{ borderCollapse: "collapse", borderRadius: "10px", overflow:"hidden" }}
        >
          <thead style={{ textAlign: "left" }}>
            <tr style={{ backgroundColor: "#ebebeb" }}>
              <th className={styles.tableSm}>Box</th>
              <th>Box Id</th>
              <th>Description</th>
              <th>Location</th>
              <th>Content Quantity</th>
              <th>Discount</th>
              <th>Min Purchase</th>
              <th>Visibility</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredBoxes.map((box, index) => (
              <tr
                key={index}
                style={{
                  width: "100%",
                  backgroundColor: index % 2 == 0 ? "#f2f2f2" : "#ebebeb",
                  cursor: "pointer",
                }}
              >
                <td
                  className={styles.tableSm}
                  style={{ position: "relative" }}
                  onClick={() => setEditBoxOpen(box)}
                >
                  <img src={box.image} alt={`Item ${index + 1}`} />
                </td>
                <td onClick={() => setEditBoxOpen(box)}>{box.boxId}</td>
                <td onClick={() => setEditBoxOpen(box)}>
                  {box.description.length > 80
                    ? box.description.slice(0, 80) + "..."
                    : box.description}
                </td>
                <td onClick={() => setEditBoxOpen(box)}>{box.location}</td>
                <td onClick={() => setEditBoxOpen(box)}>
                  {contentDict[box._id.toString()]?.length || 0}
                </td>
                <td onClick={() => setEditBoxOpen(box)}>
                  {contentDict[box._id]
                    ? contentDict[box._id][0].sale
                      ? `${box.discount}%`
                      : "N/A"
                    : "N/A"}
                </td>
                <td onClick={() => setEditBoxOpen(box)}>
                  {contentDict[box._id]
                    ? contentDict[box._id][0].sale
                      ? `$${box.minPrice}`
                      : "N/A"
                    : "N/A"}
                </td>
                <td onClick={() => setEditBoxOpen(box)}>
                  {contentDict[box._id] ? (
                    contentDict[box._id][0].public ? (
                      <MdPublic color="green" />
                    ) : (
                      <MdOutlinePublicOff color="red" />
                    )
                  ) : (
                    <MdOutlinePublicOff color="red" />
                  )}
                  {contentDict[box._id] ? (
                    contentDict[box._id][0].sale ? (
                      <HiCash color="blue" />
                    ) : (
                      ""
                    )
                  ) : (
                    "N"
                  )}
                </td>
                <td>
                  <FaRegCopy onClick={() => duplicateBox(box)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {addItemOpen && (
        <AddItem onClose={() => setAddItemOpen(false)} refresh={getInventory} />
      )}
      {addBoxOpen && (
        <AddBox onClose={() => setAddBoxOpen(false)} refresh={getInventory} />
      )}
      {editItemOpen !== null && (
        <EditItem
          item={editItemOpen}
          onClose={() => setEditItemOpen(null)}
          refresh={getInventory}
          boxes={boxes}
          items={inventory}
        />
      )}
      {editBoxOpen !== null && (
        <EditBox
          box={editBoxOpen}
          onClose={() => setEditBoxOpen(null)}
          refresh={getInventory}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
          boxes={boxes}
        />
      )}
    </div>
  );
}

export default Inventory;
