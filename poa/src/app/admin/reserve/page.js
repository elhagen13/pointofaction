"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import styles from "./reserve.module.css";
import { FiShoppingBag } from "react-icons/fi";
import { Fis } from "aws-sdk";
import SetQuantity from "./SetQuantity";


function Inventory() {
  const [quantityPopup, setQuantityPopup] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null)

  const [inventory, setInventory] = useState([]);
  const [boxes, setBoxes] = useState([]);

  const [searchValue, setSearchValue] = useState("");
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

  const [cart, addToCart] = useState([])

  const [options, setOptions] = useState({});

  useEffect(() => {
    getInventory();
    getItemOptions();
  }, []);
  console.log("options", options);

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
    console.log("kdfjsl");
  };

  useEffect(() => {
    console.log("options", options);
  }, [options]);

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
    console.log("hmmm");
    return dict;
  }, [options]);

  const boxDict = useMemo(() => {
    const dict = {};
    boxes.forEach((box) => {
      dict[box._id.toString()] = box;
    });
    return dict;
  }, [boxes]);

  const filteredInventory = useMemo(() => {
    let items = inventory;

    // First, group the items (before filtering)
    let dict = {};
    for (const item of items) {
      const style = item.style.toLowerCase();
      const color = item.color.toLowerCase();
      const brand = item.brandId || item.brand.toLowerCase();
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

  useEffect(() => {
    console.log("CART: ", cart)
  }, [cart])

  console.log("filteredInventory", filteredInventory);
  console.log("brandDict", brandDict);

  const getInventory = async () => {
    const response = await fetch("/api/inventory/item", {
      method: "GET",
    });

    const result = await response.json();

    setInventory(result.data);
  };

  return (
    <div style={{ padding: "20px" }}>
      <div className={styles.productGrid}>
        {filteredInventory.map((grouping) => {
          const representative = grouping[0];
          console.log("representative", representative);
          return (
            <div className={styles.productCard}>
              <img
                src={representative.image}
                className={styles.productImage}
              ></img>
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
              <div onClick={() => setSelectedItem(grouping)}style={{width:"100%", display:"flex", justifyContent:"end", padding:"20px", paddingTop: "0"}}>
                <div className={styles.shoppingButton}>
                    <FiShoppingBag/>
                    Add
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {selectedItem && <SetQuantity onClose={() => setSelectedItem(null)} items={selectedItem} sizeDict={sizeDict} brandDict={brandDict} descriptionDict={descriptionDict} cart={cart} addToCart={addToCart}/>}
    </div>
  );
}

export default Inventory;
