"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import styles from "./reserve.module.css";
import { FiShoppingBag } from "react-icons/fi";
import { IoSearch, IoChevronDown } from "react-icons/io5";
import SetQuantity from "./SelectOption";

export default function AddToRes({
  existingKeys,
  addedItems,
  setAddedItems,
  reservationId,
  onSuccess,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [quantityPopup, setQuantityPopup] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
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
  const [options, setOptions] = useState({});

  useEffect(() => {
    getInventory();
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

  const handleOptionSelect = (option) => {
    setSelectedSearchOption(option);
    setIsDropdownOpen(false);
  };

  const filteredInventory = useMemo(() => {
    let items = inventory;
    let dict = {};

    for (const item of items) {
      const style = item.style.toLowerCase();
      const color = item.color.toLowerCase();
      const brand =
        item.brand?.toLowerCase() ||
        brandDict[item.brandId]?.brand.toLowerCase() ||
        "N/A";
      const key = `${style}, ${color}, ${brand}`;

      if (!dict[key]) {
        dict[key] = [item];
      } else {
        dict[key].push(item);
      }
    }

    let groupedItems = Object.values(dict);

    // Filter out items that already exist in the reservation
    groupedItems = groupedItems.filter((group) => {
      const representative = group[0];
      const brand =
        representative.brand ||
        brandDict[representative.brandId]?.brand ||
        "N/A";
      const itemKey = `${brand}-${representative.style}-${representative.color}`;
      return !existingKeys.includes(itemKey);
    });

    if (searchValue.trim() === "") {
      return groupedItems;
    }

    const searchTerm = searchValue.toLowerCase().trim();
    return groupedItems.filter((group) => {
      return group.some((item) => {
        if (selectedSearchOption !== "all") {
          switch (selectedSearchOption) {
            case "style code":
              return item.style?.toLowerCase().includes(searchTerm);
            case "brand style":
              const brandText =
                item.brandId && brandDict[item.brandId.toString()]
                  ? brandDict[item.brandId.toString()].brand
                  : item.brand || "";
              return brandText.toLowerCase().includes(searchTerm);
            case "color":
              return item.color?.toLowerCase().includes(searchTerm);
            case "description":
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

        const searchWords = searchTerm
          .toLowerCase()
          .split(/\s+/)
          .filter((word) => word.length > 0);
        if (searchWords.length === 0) return true;

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
    existingKeys,
  ]);

  const getInventory = async () => {
    const response = await fetch("/api/inventory/item", {
      method: "GET",
    });
    const result = await response.json();
    setInventory(result.data);
  };

  const handleSubmitAddedItems = async () => {
    // Process added items
    for (const item of addedItems) {
      const { style, color, brand } = item;
      for (const [key, val] of Object.entries(item.sizes)) {
        await addToReservation(
          style,
          color,
          brand,
          key,
          parseInt(val.newQuantity)
        );
      }
    }

    onSuccess();
  };

  const addToReservation = async (
    style,
    color,
    brand,
    size,
    increasedQuant
  ) => {
    try {
      const response = await fetch("/api/catalog", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          style: style,
          color: color,
          brand: brand,
          size: size,
          quantityToReserve: increasedQuant,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(result)

      const editReservation = await fetch(`/api/catalog/reservation/${reservationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reservationDetails: result.reservationDetails,
          type: "add",
        }),
      });

      if (!editReservation.ok) {
        throw new Error(`HTTP error! status: ${editReservation.status}`);
      }

      return await editReservation.json();
    } catch (error) {
      console.error("Error adding to reservation:", error);
      throw new Error("Could not add item to reservation");
    }
  };

  return (
    <>
      <div
        style={{
          padding: "20px",
          maxHeight: "500px",
          overflowY: "scroll",
          marginTop: "20px",
          border: "3px solid #e8e6e6ff",
          borderRadius: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <div className={styles.searchContainer} ref={dropdownRef}>
            <IoSearch className={styles.search} />
            <input
              className={styles.searchInput}
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
              }}
              placeholder={`Search ${
                selectedSearchOption === "all"
                  ? "everything"
                  : selectedSearchOption
              }...`}
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
                    className={`${styles.dropdownItem} ${
                      selectedSearchOption === option ? styles.selected : ""
                    }`}
                    onClick={() => handleOptionSelect(option)}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.productGrid}>
          {filteredInventory.map((grouping, index) => {
            const representative = grouping[0];
            return (
              <div
                key={index}
                className={styles.productCard}
                onClick={() => setSelectedItem(grouping)}
              >
                <div style={{ width: "100%", backgroundColor: "white" }}>
                  <img
                    style={{ objectFit: "contain" }}
                    src={representative.image}
                    className={styles.productImage}
                  />
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
                      descriptionDict[representative.descriptionId]
                        ?.description}
                  </div>
                </div>
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "end",
                    padding: "20px",
                    paddingTop: "0",
                  }}
                >
                  <div className={styles.shoppingButton}>
                    <FiShoppingBag />
                    Add
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Show added items preview */}
        {addedItems.length > 0 && (
          <div
            style={{
              marginTop: "20px",
              padding: "10px",
              background: "#f5f5f5",
              borderRadius: "8px",
            }}
          >
            {addedItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: "10px",
                  padding: "8px",
                  background: "white",
                  borderRadius: "4px",
                }}
              >
                <div>
                  <strong>
                    {item.brand} - {item.style} - {item.color}
                  </strong>
                </div>
                <div style={{ fontSize: "0.9em", color: "#666" }}>
                  Sizes:{" "}
                  {Object.entries(item.sizes)
                    .filter(([_, data]) => data.newQuantity > 0)
                    .map(([size, data]) => `${size}: ${data.newQuantity}`)
                    .join(", ")}
                </div>
              </div>
            ))}
            <button
              onClick={handleSubmitAddedItems}
              disabled={submitting}
              className={styles.submitButton}
              style={{
                marginTop: "10px",
                padding: "10px 20px",
                background: submitting ? "#ccc" : "#1c54ce",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: submitting ? "not-allowed" : "pointer",
                fontWeight: "bold",
              }}
            >
              {submitting ? "Adding..." : "Submit All Items to Reservation"}
            </button>
          </div>
        )}
      </div>

      {selectedItem && (
        <SetQuantity
          onClose={() => setSelectedItem(null)}
          items={selectedItem}
          sizeDict={sizeDict}
          brandDict={brandDict}
          descriptionDict={descriptionDict}
          addedItems={addedItems}
          setAddedItems={setAddedItems}
        />
      )}
    </>
  );
}
