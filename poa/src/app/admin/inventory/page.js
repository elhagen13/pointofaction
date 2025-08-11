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
import MultiOpen from "./MultiOpen.js";

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

  const [multiOpen, setMultiOpen] = useState(null)

  const [inventory, setInventory] = useState([]);
  const [boxes, setBoxes] = useState([]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const dropdownRef = useRef(null);
  const searchOptions = [
    "all",
    "style code",
    "brand style",
    "color",
    "description",
    "quantity",
    "box",
    "location",
  ];
  const [selectedSearchOption, setSelectedSearchOption] = useState("all");

  const [options, setOptions] = useState({});
  const [savedInfo, setSavedInfo] = useState({
    addBox: {},
    addItem: {},
  });

  
  const getBoxes = async () => {
    const response = await fetch("/api/inventory/box", {
      method: "GET",
    });

    const result = await response.json();
    setBoxes(result.data);
  };

  useEffect(() => {
    getBoxes();
  }, [inventory]);

  useEffect(() => {
    getInventory();
    getItemOptions();
  }, []);

  const refresh = () => {
    getInventory();
    getItemOptions();
    getBoxes();
  };

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
    console.log(resultDescriptions);

    setOptions({
      ...options,
      brands: resultBrands.data,
      sizes: resultSizes.data,
      descriptions: resultDescriptions.data,
    });
  };
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

// Filter inventory based on page selection and search, then group
// Filter inventory based on page selection and search, then group
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

  // First, group the items (before filtering)
  let dict = {};
  for (const item of items) {
    const style = item.style.toLowerCase();
    const color = item.color.toLowerCase();
    const size = item.sizeId || item.size.toLowerCase();
    const key = `${style}, ${color}, ${size}`;

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
            const brandText = item.brandId && brandDict[item.brandId.toString()] 
              ? brandDict[item.brandId.toString()].brand 
              : item.brand || "";
            return brandText.toLowerCase().includes(searchTerm);
          case "color":
            return item.color?.toLowerCase().includes(searchTerm);
          case "description":
            // Check both direct description and descriptionId reference
            const descriptionText = item.descriptionId && descriptionDict[item.descriptionId.toString()]
              ? descriptionDict[item.descriptionId.toString()].description
              : item.description || "";
            return descriptionText.toLowerCase().includes(searchTerm);
          case "quantity":
            return item.quantity?.toString().includes(searchTerm);
          case "box":
            const boxId = boxDict[item.boxId?.toString()]?.boxId;
            return boxId?.toLowerCase().includes(searchTerm);
          case "location":
            const location = boxDict[item.boxId?.toString()]?.location;
            return location?.toLowerCase().includes(searchTerm);
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
      const brandText = item.brandId && brandDict[item.brandId.toString()] 
        ? brandDict[item.brandId.toString()].brand 
        : item.brand || "";
      const descriptionText = item.descriptionId && descriptionDict[item.descriptionId.toString()]
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

      console.log("ITEMTEXT:", itemText)
      console.log("searchWORDS:", searchWords)

      // Check if ALL search words are found in the combined text
      return searchWords.every((word) => itemText.includes(word));
    });
  });
}, [inventory, page, searchValue, selectedSearchOption, boxDict, brandDict, descriptionDict]);

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
          style: content.style,
          color: content.color,
          quantity: content.quantity,
          price: content.price,
          sale: content.sale || false,
          public: content.public || false,
        };

        if (content.descriptionId)
          itemData.descriptionId = content.descriptionId;
        else itemData.description = content.description;

        if (content.brandId) itemData.brandId = content.brandId;
        else itemData.brand = content.brand;

        if (content.sizeId) itemData.sizeId = content.sizeId;
        else itemData.size = content.size;

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

  const getDescription = (item) => {
    let des = "";
    if (
      item[0].descriptionId &&
      descriptionDict[item[0].descriptionId.toString()]
    ) {
      des = descriptionDict[item[0].descriptionId.toString()].description;
    } else if (item[0].description) des = item[0].description;
    else return "N/A";
    return des.length > 50 ? des.slice(0, 50) + "..." : des;
  };

  const getBrand = (item, clicked) => {
    let brand = item[0].brand || item[0].brandId;

    for (const i of item) {
      if (
        (i.brand && i.brand.toLowerCase() !== brand.toLowerCase()) ||
        (i.brandId && i.brandId !== brand)
      ) {
        return "Various";
      }
    }

    if (item[0].brandId && brandDict[item[0].brandId.toString()]) {
      brand = brandDict[item[0].brandId.toString()].brand;
    } else if (item[0].brand) brand = item[0].brand;
    else return "N/A";
    return brand;
  };

  const getSize = (item) => {
    let size = "";
    if (item[0].sizeId && sizeDict[item[0].sizeId.toString()])
      size = sizeDict[item[0].sizeId.toString()].size;
    else if (item[0].size) size = item[0].size;
    else return "N/A";
    return size;
  };

  const getBox = (item) => {
    let same = item[0].boxId;
    for(const i of item){
      if(i.boxId !== same){
        return "Multi"
      }
    }
    return boxDict[same].boxId || "N/A"
  };


  const getLocation = (item) => {
    let firstLocation = item.location || (item[0].boxId && boxDict[item[0].boxId].location) || null;
    let curLocation = ""
    for(const i of item){
      curLocation = i.location || boxDict[i.boxId].location || null;
      if(curLocation !== firstLocation) return "Multi"
    }
    return firstLocation
  };

  const getPrice = (item) => {
    let same = item[0].price;
    for(const i of item){
      if(i.price !== same){
        return "Multi"
      }
    }
    return same || "N/A"
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
          <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
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
      </div>
      <div style={{ overflowX: "scroll" }}>
        {filter === "line items" && (
          <table
            className={styles.inventoryTable}
            style={{ borderCollapse: "collapse", borderRadius: "10px" }}
          >
            <thead>
              <tr style={{ backgroundColor: "#ebebeb" }}>
                <th className={styles.tableSm}>Item</th>
                <th style={{ minWidth: "200px" }}>Description</th>
                <th>Style Code</th>
                <th>Brand Style</th>
                <th>Color</th>
                <th>Size</th>
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
                    overflow: "scroll",
                  }}
                  onClick={() => {
                      if(item.length === 1 && boxDict[item[0].boxId?.toString()]){
                        setEditBoxOpen(boxDict[item[0].boxId?.toString()]);
                      }
                      else if(item.length === 1){
                        setEditItemOpen(item[0]);
                      }
                      else setMultiOpen(item)
                  }}
                >
                  <td
                    className={styles.tableSm}
                    style={{ position: "relative" }}
                  >
                    <img src={item[0].image} alt={`Item ${index + 1}`} />
                  </td>
                  <td style={{ minWidth: "100px" }}>{getDescription(item)}</td>
                  <td style={{ minWidth: "100px" }}>{item[0].style}</td>
                  <td style={{ minWidth: "100px" }}>{getBrand(item)}</td>
                  <td style={{ minWidth: "100px" }}>{item[0].color}</td>
                  <td style={{ minWidth: "100px" }}>{getSize(item)}</td>
                  <td style={{ minWidth: "100px" }}>{item.reduce((acc, cur) => acc + cur.quantity, 0)}</td>
                  {boxDict[item[0].boxId?.toString()] ? (
                    <td
                      onClick={() =>
                        setEditBoxOpen(boxDict[item.boxId?.toString()])
                      }
                      style={{ cursor: "pointer", minWidth: "100px" }}
                    >
                      {getBox(item)}
                    </td>
                  ) : (
                    <td style={{ minWidth: "100px" }}>N/A</td>
                  )}
                  <td style={{ minWidth: "100px" }}>
                    {getLocation(item)}
                  </td>
                  <td style={{ minWidth: "100px" }}>{getPrice(item) !== "Multi" ? `$${getPrice(item)}` : "Multi"}</td>
                  <td style={{ minWidth: "100px" }}>
                    {item.every(i => i.public) ? (
                      <MdPublic color="green" />
                    ) : 
                    item.some(i => i.public) ? (
                      <MdPublic color="orange"/>
                    ) : (
                      <MdOutlinePublicOff color="red" />
                    )
                  }

                    {item.every(i => i.sale) ? <HiCash color="blue" /> : item.some(i => i.sale) ? <HiCash color="orange"/> : <></>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {filter === "boxes" && (
          <table
            className={styles.inventoryTable}
            style={{
              borderCollapse: "collapse",
              borderRadius: "10px",
              overflow: "auto",
            }}
          >
            <thead style={{ textAlign: "left" }}>
              <tr style={{ backgroundColor: "#ebebeb" }}>
                <th>Box</th>
                <th>Box Id</th>
                <th>Description</th>
                <th>Location</th>
                <th>Total Quant.</th>
                <th>Discount</th>
                <th>Min.</th>
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
                    style={{ position: "relative" }}
                    onClick={() => setEditBoxOpen(box)}
                  >
                    <div className={styles.tableSm}>
                      <img src={box.image} alt={`Item ${index + 1}`} />
                    </div>
                  </td>
                  <td
                    onClick={() => setEditBoxOpen(box)}
                    style={{ minWidth: "100px" }}
                  >
                    {box.boxId}
                  </td>
                  <td
                    onClick={() => setEditBoxOpen(box)}
                    style={{ minWidth: "100px" }}
                  >
                    {box.description.length > 80
                      ? box.description.slice(0, 80) + "..."
                      : box.description}
                  </td>
                  <td
                    onClick={() => setEditBoxOpen(box)}
                    style={{ minWidth: "100px" }}
                  >
                    {box.location}
                  </td>
                  <td
                    onClick={() => setEditBoxOpen(box)}
                    style={{ minWidth: "100px" }}
                  >
                    {contentDict[box._id.toString()]?.reduce(
                      (acc, cur) => acc + cur.quantity,
                      0
                    ) || 0}
                  </td>
                  <td
                    onClick={() => setEditBoxOpen(box)}
                    style={{ minWidth: "100px" }}
                  >
                    {contentDict[box._id]
                      ? contentDict[box._id][0].sale
                        ? `${box.discount}%`
                        : "N/A"
                      : "N/A"}
                  </td>
                  <td
                    onClick={() => setEditBoxOpen(box)}
                    style={{ minWidth: "100px" }}
                  >
                    {contentDict[box._id]
                      ? contentDict[box._id][0].sale
                        ? `$${box.minPrice}`
                        : "N/A"
                      : "N/A"}
                  </td>
                  <td
                    onClick={() => setEditBoxOpen(box)}
                    style={{ minWidth: "100px" }}
                  >
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
                      ""
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
      </div>

      {addItemOpen && (
        <AddItem
          onClose={() => setAddItemOpen(false)}
          refresh={refresh}
          savedInfo={savedInfo}
          setSavedInfo={setSavedInfo}
        />
      )}
      {addBoxOpen && (
        <AddBox
          onClose={() => setAddBoxOpen(false)}
          refresh={refresh}
          options={options}
          savedInfo={savedInfo}
          setSavedInfo={setSavedInfo}
        />
      )}
      {editItemOpen !== null && (
        <EditItem
          item={editItemOpen}
          onClose={() => setEditItemOpen(null)}
          refresh={refresh}
          boxes={boxes}
          items={inventory}
        />
      )}
      {editBoxOpen !== null && (
        <EditBox
          box={editBoxOpen}
          onClose={() => setEditBoxOpen(null)}
          refresh={refresh}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
          boxes={boxes}
          options={options}
        />
      )}
      {
        multiOpen !== null && (
          <MultiOpen items={multiOpen}
          onClose={() => setMultiOpen(null)}
          setEditBoxOpen={setEditBoxOpen}
          boxDict={boxDict}
          sizeDict={sizeDict}
          descriptionDict={descriptionDict}
          brandDict={brandDict}
          />

        )
      }
    </div>
  );
}

export default Inventory;
