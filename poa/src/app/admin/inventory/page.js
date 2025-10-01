"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import styles from "./inventory.module.css";
import { FaRegCopy, FaEye, FaArrowDown, FaArrowUp, FaRegBell, FaRegBellSlash } from "react-icons/fa";
import { IoSearch, IoChevronDown, IoChevronUp, IoEllipsisHorizontal, IoAlert, IoArrowDown, IoArrowUp } from "react-icons/io5";
import { BiSelectMultiple, BiSolidSelectMultiple } from "react-icons/bi";
import {
  MdPublic,
  MdOutlinePublicOff,
  MdLayers,
  MdViewColumn,
} from "react-icons/md";
import { HiCash } from "react-icons/hi";

import AddItem from "./AddItem.js";
import AddBox from "../../components/admin/AddBox.js";
import EditItem from "./EditItem.js";
import EditBox from "./EditBox.js";
import MultiOpen from "./MultiOpen.js";
import GroupedView from "./GroupedView.js";
import ColumnManager from "./components/ColumnManager";

import Popup from "@/app/components/popups/Popup";
import { useUser } from "@clerk/nextjs";

import SetAlert from "./components/SetAlert";

function Inventory() {
  /*"all inventory", "boxes", "public", "sale"*/
  const [page, setPage] = useState("all inventory");
  const pageOptions = ["all inventory", "public", "sale"];
  const [filter, setFilter] = useState("line items");
  /*options: description, style, brand, color size, quantity*/
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState(false);

  const colors = ["#BDCE67", "#93A537", "#6B7B15"];

  const [selectedItem, setSelectedItem] = useState(null);

  const [addBoxOpen, setAddBoxOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editItemOpen, setEditItemOpen] = useState(null);
  const [editBoxOpen, setEditBoxOpen] = useState(null);

  const [columnManagerOpen, setColumnManagerOpen] = useState(false);

  const [multiOpen, setMultiOpen] = useState(null);
  const [groupedView, setGroupedView] = useState(null);

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
    "size",
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

  const [keys, setKeys] = useState([])

  const [popup, setPopup] = useState(null);

  const { user } = useUser();

  const [paginate, setPaginate] = useState(0);
  const [numItemsPage, setNumItemsPage] = useState(15);
  const [numPages, setNumPages] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const [multiEdit, setMultiEdit] = useState(false)

  const [columns, setColumns] = useState({
    lineItems: [
      { Image: true },
      { Description: true },
      { Style: true },
      { Brand: true },
      { Color: true },
      { Size: true },
      { Quantity: true },
      { Box: true },
      { Location: true },
      { Price: false },
      { Visibility: true },
    ],
    boxes: [
      { Image: true },
      { "Box Id.": true },
      { Description: true },
      { Location: true },
      { "Total Quantity": true },
      { Discount: true },
      { "Min.": true },
      { Visibility: true },
    ],
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
    getKeys();
    if (localStorage.getItem("columns"))
      setColumns(JSON.parse(localStorage.getItem("columns")));
  }, []);

  const refresh = async () => {
    await getInventory();
    await getItemOptions();
    await getBoxes();
    await getKeys();

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

    response = await fetch("/api/details/common", {
      method: "GET",
    });
    let resultCombos = await response.json();

    console.log(resultDescriptions);

    setOptions({
      ...options,
      brands: resultBrands.data,
      sizes: resultSizes.data,
      descriptions: resultDescriptions.data,
      combos: resultCombos.data,
    });
  };

  const getKeys = async () => {
    let response = await fetch("/api/inventory/tracker", {
      method: "GET",
    });

    let result = await response.json();
    console.log(result.data)
    setKeys(result.data)

  }

  const keyDict = useMemo(() => {
    const dict = {};
    keys.forEach((item) => {
      dict[item.key?.toString()] = item
    });
    return dict;
  }, [keys]);


  const getKey = (item) => {
    return `${item[0]?.brand || brandDict[item[0]?.brandId]?.brand
      || "No brand"}-${item[0].style || "No style"}-${item[0]?.size || sizeDict[item[0]?.sizeId]?.size
      || "No size"}-${item[0]?.color}`
  }



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
      dict[box._id.toString()].items = [];
    });

    return dict;
  }, [boxes]);

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

      // Resolve size from ID or use direct value
      const size = item.sizeId && sizeDict[item.sizeId.toString()]
        ? sizeDict[item.sizeId.toString()].size.toLowerCase()
        : (item.size || "n/a").toLowerCase();

      // Resolve brand from ID or use direct value
      const brand = item.brandId && brandDict[item.brandId.toString()]
        ? brandDict[item.brandId.toString()].brand.toLowerCase()
        : (item.brand || "n/a").toLowerCase();

      const key = `${style}, ${color}, ${size}, ${brand}`;

      if (!dict[key]) {
        dict[key] = [item];
      } else {
        dict[key].push(item);
      }
    }

    let groupedItems = Object.values(dict);

    // Now filter the groups based on search criteria
    if (searchValue.trim() !== "") {
      const searchTerm = searchValue.toLowerCase().trim();

      groupedItems = groupedItems.filter((group) => {
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
              case "size":
                // Check both direct size and sizeId reference
                const sizeText =
                  item.sizeId && sizeDict[item.sizeId.toString()]
                    ? sizeDict[item.sizeId.toString()].size
                    : item.size || "";
                return sizeText.toLowerCase().includes(searchTerm);
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
          const sizeText =
            item.sizeId && sizeDict[item.sizeId.toString()]
              ? sizeDict[item.sizeId.toString()].size
              : item.size || "";

          const itemText = [
            item.style || "",
            brandText,
            item.color || "",
            descriptionText,
            sizeText,
            item.quantity?.toString() || "",
            boxDict[item.boxId?.toString()]?.boxId || "",
            boxDict[item.boxId?.toString()]?.location || "",
          ]
            .join(" ")
            .toLowerCase();

          console.log("ITEMTEXT:", itemText);
          console.log("searchWORDS:", searchWords);

          // Check if ALL search words are found in the combined text
          return searchWords.every((word) => itemText.includes(word));
        });
      });
    }

    setNumPages(
      Math.floor(
        groupedItems.length / numItemsPage +
        (groupedItems.length % numItemsPage !== 0 ? 1 : 0)
      )
    );

    return groupedItems
      .sort((a, b) => {
        const getTextForSort = (group, field) => {
          const item = group[0];
          const quantity = group.reduce((a, b) => a + b.quantity, 0)
          switch (field) {
            case "description":
              return item.descriptionId &&
                descriptionDict[item.descriptionId.toString()]
                ? descriptionDict[item.descriptionId.toString()].description
                : item.description || "";
            case "style":
              return item.style || "";
            case "brand":
              return item.brandId && brandDict[item.brandId.toString()]
                ? brandDict[item.brandId.toString()].brand
                : item.brand || "";
            case "color":
              return item.color || "";
            case "size":
              return item.sizeId && sizeDict[item.sizeId.toString()]
                ? sizeDict[item.sizeId.toString()].size
                : item.size || "";
            case "quantity":
              return quantity || 0;
            case "box":
              return boxDict[item.boxId]?.boxId || 0;
            default:
              return "";
          }
        };

        switch (sortBy) {
          case "description":
            const aDesc = getTextForSort(a, "description").toLowerCase();
            const bDesc = getTextForSort(b, "description").toLowerCase();
            return sortOrder
              ? aDesc.localeCompare(bDesc)
              : bDesc.localeCompare(aDesc);
          case "style":
            const aStyle = getTextForSort(a, "style").toLowerCase();
            const bStyle = getTextForSort(b, "style").toLowerCase();
            return sortOrder
              ? aStyle.localeCompare(bStyle)
              : bStyle.localeCompare(aStyle);
          case "brand":
            const aBrand = getTextForSort(a, "brand").toLowerCase();
            const bBrand = getTextForSort(b, "brand").toLowerCase();
            return sortOrder
              ? aBrand.localeCompare(bBrand)
              : bBrand.localeCompare(aBrand);
          case "color":
            const aColor = getTextForSort(a, "color").toLowerCase();
            const bColor = getTextForSort(b, "color").toLowerCase();
            return sortOrder
              ? aColor.localeCompare(bColor)
              : bColor.localeCompare(aColor);
          case "size":
            const aSize = getTextForSort(a, "size").toLowerCase();
            const bSize = getTextForSort(b, "size").toLowerCase();
            return sortOrder
              ? aSize.localeCompare(bSize)
              : bSize.localeCompare(aSize);
          case "quantity":
            const aQty = getTextForSort(a, "quantity");
            const bQty = getTextForSort(b, "quantity");
            if (sortOrder === "alerts") {
              const aHasAlert = keyDict[getKey(a)]?.quantity !== undefined;
              const bHasAlert = keyDict[getKey(b)]?.quantity !== undefined;

              if (aHasAlert && !bHasAlert) return -1;
              if (!aHasAlert && bHasAlert) return 1;

              if (aHasAlert && bHasAlert) {
                const aDiff = (keyDict[getKey(a)]?.quantity || 0) - aQty;
                const bDiff = (keyDict[getKey(b)]?.quantity || 0) - bQty;
                return bDiff - aDiff;
              }

              return bQty - aQty;
            }

            return sortOrder ? aQty - bQty : bQty - aQty;

          case "box":
            const aBox = getTextForSort(a, "box");
            const bBox = getTextForSort(b, "box");
            return sortOrder ? aBox - bBox : bBox - aBox;
          default:
            return 0;
        }
      })
      .slice(
        showAll ? 0 : paginate * numItemsPage,
        showAll ? groupedItems.length : paginate * numItemsPage + numItemsPage
      );
  }, [
    inventory,
    page,
    searchValue,
    selectedSearchOption,
    boxDict,
    brandDict,
    descriptionDict,
    sizeDict,
    sortBy,
    sortOrder,
    paginate,
    showAll,
    keyDict,
  ]);

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

    return boxItems.filter((box) => {
      if (selectedSearchOption !== "all") {
        switch (selectedSearchOption) {
          case "style code":
            return box.style?.toLowerCase().includes(searchTerm);
          case "brand style":
            return box.brand?.toLowerCase().includes(searchTerm);
          case "color":
            return box.color?.toLowerCase().includes(searchTerm);
          case "description":
            return box.description?.toLowerCase().includes(searchTerm);
          case "quantity":
            // For boxes, search in the total quantity of contents
            const totalQuantity = (
              contentDict[box._id.toString()] || []
            ).reduce((acc, item) => acc + item.quantity, 0);
            return totalQuantity.toString().includes(searchTerm);
          case "box":
            // For boxes, search by the box's own boxId
            return box.boxId?.toLowerCase().includes(searchTerm);
          case "location":
            // For boxes, search by the box's own location
            return box.location?.toLowerCase().includes(searchTerm);
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

      // Calculate total quantity for this box
      const totalQuantity = (contentDict[box._id.toString()] || []).reduce(
        (acc, item) => acc + item.quantity,
        0
      );

      // Combine all searchable text for this box
      const boxText = [
        box.style || "",
        box.brand || "",
        box.color || "",
        box.description || "",
        totalQuantity.toString() || "",
        box.boxId || "",
        box.location || "",
      ]
        .join(" ")
        .toLowerCase();

      // Check if ALL search words are found in the combined text
      return searchWords.every((word) => boxText.includes(word));
    });
  }, [boxes, contentDict, page, searchValue, selectedSearchOption, boxDict]);

  const filteredGroups = useMemo(() => {
    let items = inventory;

    // First, group the items (before filtering)
    let dict = {};
    for (const item of items) {
      const style = item.style.toLowerCase();
      const brand =
        brandDict[item.brandId]?.brand?.toLowerCase() ||
        item.brand?.toLowerCase() ||
        "N/A";
      const key = `${style}, ${brand}`;

      if (!dict[key]) {
        dict[key] = [item];
      } else {
        dict[key].push(item);
      }
    }

    let groupedItems = Object.values(dict);
    // Now filter the groups based on search criteria
    if (searchValue.trim() !== "") {
      const searchTerm = searchValue.toLowerCase().trim();

      groupedItems = groupedItems.filter((group) => {
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
              case "size":
                // Check both direct size and sizeId reference
                const sizeText =
                  item.sizeId && sizeDict[item.sizeId.toString()]
                    ? sizeDict[item.sizeId.toString()].size
                    : item.size || "";
                return sizeText.toLowerCase().includes(searchTerm);
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
          const sizeText =
            item.sizeId && sizeDict[item.sizeId.toString()]
              ? sizeDict[item.sizeId.toString()].size
              : item.size || "";

          const itemText = [
            item.style || "",
            brandText,
            item.color || "",
            descriptionText,
            sizeText,
            item.quantity?.toString() || "",
            boxDict[item.boxId?.toString()]?.boxId || "",
            boxDict[item.boxId?.toString()]?.location || "",
          ]
            .join(" ")
            .toLowerCase();

          console.log("ITEMTEXT:", itemText);
          console.log("searchWORDS:", searchWords);

          // Check if ALL search words are found in the combined text
          return searchWords.every((word) => itemText.includes(word));
        });
      });
    }

    return groupedItems.sort((a, b) => {
      const getTextForSort = (group, field) => {
        const item = group[0];
        switch (field) {
          case "description":
            return item.descriptionId &&
              descriptionDict[item.descriptionId.toString()]
              ? descriptionDict[item.descriptionId.toString()].description
              : item.description || "";
          case "style":
            return item.style || "";
          case "brand":
            return item.brandId && brandDict[item.brandId.toString()]
              ? brandDict[item.brandId.toString()].brand
              : item.brand || "";
          case "color":
            return item.color || "";
          case "size":
            return item.sizeId && sizeDict[item.sizeId.toString()]
              ? sizeDict[item.sizeId.toString()].size
              : item.size || "";
          case "quantity":
            return item.quantity || 0;
          case "box":
            return boxDict[item.boxId]?.boxId || 0;
          default:
            return "";
        }
      };

      switch (sortBy) {
        case "description":
          const aDesc = getTextForSort(a, "description").toLowerCase();
          const bDesc = getTextForSort(b, "description").toLowerCase();
          return sortOrder
            ? aDesc.localeCompare(bDesc)
            : bDesc.localeCompare(aDesc);
        case "style":
          const aStyle = getTextForSort(a, "style").toLowerCase();
          const bStyle = getTextForSort(b, "style").toLowerCase();
          return sortOrder
            ? aStyle.localeCompare(bStyle)
            : bStyle.localeCompare(aStyle);
        case "brand":
          const aBrand = getTextForSort(a, "brand").toLowerCase();
          const bBrand = getTextForSort(b, "brand").toLowerCase();
          return sortOrder
            ? aBrand.localeCompare(bBrand)
            : bBrand.localeCompare(aBrand);
        case "color":
          const aColor = getTextForSort(a, "color").toLowerCase();
          const bColor = getTextForSort(b, "color").toLowerCase();
          return sortOrder
            ? aColor.localeCompare(bColor)
            : bColor.localeCompare(aColor);
        case "size":
          const aSize = getTextForSort(a, "size").toLowerCase();
          const bSize = getTextForSort(b, "size").toLowerCase();
          return sortOrder
            ? aSize.localeCompare(bSize)
            : bSize.localeCompare(aSize);
        case "quantity":
          const aQty = getTextForSort(a, "quantity");
          const bQty = getTextForSort(b, "quantity");
          return sortOrder ? aQty - bQty : bQty - aQty;
        case "box":
          const aBox = getTextForSort(a, "box");
          const bBox = getTextForSort(b, "box");
          return sortOrder ? aBox - bBox : bBox - aBox;
        default:
          return 0; // No sorting
      }
    });
  }, [
    inventory,
    page,
    searchValue,
    selectedSearchOption,
    boxDict,
    brandDict,
    descriptionDict,
    sizeDict,
    sortBy,
    sortOrder,
    paginate,
    showAll,
  ]);

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
        history: [
          {
            user: user?.fullName,
            createdOn: new Date(),
          },
        ],
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

  const getBrand = (item) => {
    let brand = item[0].brand || item[0].brandId;

    for (const i of item) {
      if (
        (i.brand && brand && i.brand.toLowerCase() !== brand.toLowerCase()) ||
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
    for (const i of item) {
      if (i.boxId !== same) {
        return "Multi";
      }
    }
    return boxDict[same].boxId || "N/A";
  };

  const getLocation = (item, clicked = false) => {
    if (clicked) console.log("CLICKED", item);
    let firstLocation =
      item[0].location ||
      (item[0].boxId && boxDict[item[0].boxId]?.location) ||
      null;
    let curLocation = "";
    for (const i of item) {
      curLocation = i.location || boxDict[i.boxId]?.location || null;
      if (curLocation !== firstLocation) return "Multi";
    }
    return firstLocation;
  };

  const getPrice = (item) => {
    let same = item[0].price;
    for (const i of item) {
      if (i.price !== same) {
        return "Multi";
      }
    }
    return same || "N/A";
  };

  const getVisibleColumns = (viewType) => {
    const currentColumns = columns[viewType] || [];
    return currentColumns.filter((column) => Object.values(column)[0]);
  };

  const zeroInventory = (item) => {
    setSavedInfo({
      addBox: {
        contents: [
          {
            imageUrl: item[0].image,
            descriptionId: item[0].descriptionId || null,
            decription: item[0].description || null,
            style: item[0].style,
            brand: item[0].brand || null,
            brandId: item[0].brandId || null,
            size: item[0].size || null,
            sizeId: item[0].sizeId || null,
            color: item[0].color,
            price: item[0].price
          }
        ]

      },
      addItem: { ...savedInfo.addItem }
    })
    setAddBoxOpen(true)
  }



  return (
    <div
      className={styles.inventoryBackground}
      style={{ color: "black", position: "relative" }}
    >
      {popup && <Popup closePopup={() => setPopup(null)} popupType={popup} />}
      <div className={styles.addSelection}>
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
            onChange={(e) => {
              setPaginate(0);
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
              Group View
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
                }}
                className={`${styles.pageButton}`}
                disabled={filter === "grouped"}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ overflowX: "scroll" }}>
        {filter === "line items" && (
          <div className={styles.pages}>
            {paginate > 0 && !showAll && (
              <div
                className={styles.paginate}
                onClick={() => setPaginate(paginate - 1)}
              >
                {paginate}
              </div>
            )}
            {!showAll && (
              <div
                className={styles.paginate}
                style={{ backgroundColor: "rgb(140, 140, 140)" }}
              >
                {paginate + 1}
              </div>
            )}
            {paginate < numPages - 1 && !showAll && (
              <div
                className={styles.paginate}
                onClick={() => setPaginate(paginate + 1)}
              >
                {paginate + 2}
              </div>
            )}
            <div
              style={{ marginLeft: "auto" }}
              className={styles.paginate}
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "Show Pages" : "Show All"}
            </div>
          </div>
        )}
        {filter !== "grouped" && (
          <div style={{ width: "100%", position: "relative", display: "flex", justifyContent: "end", gap: "10px" }}>
            {filter === "line items" && <button style={{
              marginBottom: "10px",
              backgroundColor: "white",
            }}
              className={styles.pageButton}
              onClick={() => setMultiEdit(!multiEdit)}
            >
              <BiSelectMultiple style={{ marginRight: "5px" }} /> Edit Mode {multiEdit ? "Off" : "On"}
            </button>}
            <button
              style={{
                marginBottom: "10px",
                backgroundColor: "white",
              }}
              className={styles.pageButton}
              onClick={() => setColumnManagerOpen(!columnManagerOpen)}
            >
              <MdViewColumn style={{ marginRight: "5px" }} />
              {columnManagerOpen ? "Close Column Manager" : "Manage Columns"}
            </button>
            {columnManagerOpen && (
              <ColumnManager
                isOpen={columnManagerOpen}
                onClose={() => setColumnManagerOpen(false)}
                columns={columns}
                setColumns={setColumns}
                viewType={filter === "boxes" ? "boxes" : "lineItems"}
              />
            )}
          </div>
        )}

        {filter === "grouped" && (
          <>
            <div className={styles.filteredGroupImageGrid}>
              {filteredGroups.map((group, index) => (
                <div
                  className={styles.group}
                  onClick={() => setGroupedView(index)}
                >
                  <div className={styles.groupImageContainer}>
                    <img
                      
                      src={group.find(item => item.color.toLowerCase().includes(searchValue.toLowerCase()))?.image || group[0].image }
                      style={{ objectFit: "contain" }}
                    />
                    {
                      group.some(item => keyDict[getKey([item])]?.quantity > item.quantity) && (
                        <div className={styles.partialOverlay}>
                        </div>
                      )
                    }
                  </div>
                  <div style={{ fontWeight: "bold" }}>
                    {brandDict[group[0].brandId]?.brand || group[0].brand}{" "}
                    {group[0].style}
                  </div>
                  <div className={styles.groupedDescription}>
                    {descriptionDict[group[0].descriptionId]?.description ||
                      group[0].description}
                  </div>
                  <button
                    style={{ marginTop: "auto" }}
                    className={styles.groupedViewButton}
                  >
                    <MdLayers />
                    {group.length} variants found
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
        {filter === "line items" && (
          <>
            <table
              className={styles.inventoryTable}
              style={{ borderCollapse: "collapse", borderRadius: "10px" }}
            >
              <thead>
                <tr style={{ backgroundColor: "#ebebeb" }}>
                  {
                    multiEdit &&
                    <th></th>
                  }

                  {getVisibleColumns("lineItems").map((column, index) => {
                    const columnName = Object.keys(column)[0];
                    const isSortable = [
                      "Description",
                      "Style",
                      "Brand",
                      "Color",
                      "Size",
                      "Quantity",
                      "Box",
                    ].includes(columnName);


                    return (
                      <th
                        key={columnName}
                        className={columnName === "Image" ? styles.tableSm : ""}
                        style={{
                          ...(columnName === "Description" && {
                            minWidth: "200px",
                          }),
                          ...(isSortable && { cursor: "pointer" }),
                        }}
                        onClick={() => {
                          console.log(sortOrder)
                          if (isSortable) {
                            const sortValue = columnName
                              .toLowerCase()
                              .replace(" ", "");

                            setSortBy(
                              sortValue === "brand" ? "brand" : sortValue
                            );


                            setSortOrder(sortValue !== "quantity" ? !sortOrder
                              : sortOrder === "alerts" ? true : !sortOrder ? "alerts" : false
                            );

                          }
                        }}
                      >
                        {columnName}
                        {isSortable &&
                          sortBy ===
                          columnName.toLowerCase().replace(" ", "") &&
                          (sortOrder === true ? (
                            <IoArrowDown
                              style={{
                                marginLeft: "5px",
                                transform: "translateY(2px)",
                              }}
                            />
                          ) : !sortOrder ? (
                            <IoArrowUp
                              style={{
                                marginLeft: "5px",
                                transform: "translateY(2px)",
                              }}
                            />
                          ) :
                            <IoAlert style={{
                              marginLeft: "5px",
                              transform: "translateY(2px)",
                            }} />
                          )}
                      </th>
                    );

                  })}
                  {
                    multiEdit &&
                    <th></th>
                  }
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item, index) => {
                  const quantity = item.reduce((acc, cur) => acc + cur.quantity, 0);
                  const uniqueKey = getKey(item);

                  return (
                    <tr
                      key={uniqueKey}
                      style={{
                        backgroundColor: (keyDict[getKey(item)] && quantity === 0) ? "#e2aeaaff"
                          : (parseInt(keyDict[getKey(item)]?.quantity) > quantity) ?
                            "#f1d7a9ff" : index % 2 == 0 ? "#f2f2f2" : "#ebebeb",
                        overflow: "scroll",
                      }}
                      onClick={() => {
                        getLocation(item, true);
                        if (quantity === 0) {
                          zeroInventory(item);
                          return;
                        }
                        if (
                          item.length === 1 &&
                          boxDict[item[0].boxId?.toString()]
                        ) {
                          setEditBoxOpen(boxDict[item[0].boxId?.toString()]);
                        } else if (item.length === 1) {
                          setEditItemOpen(item[0]);
                        } else setMultiOpen(item);
                      }}
                    >
                      {
                        multiEdit &&
                        <td className={styles.tableSm} onClick={(e) => { e.stopPropagation() }}><input type="checkbox" /></td>
                      }
                      {getVisibleColumns("lineItems").map((column) => {
                        const columnName = Object.keys(column)[0];

                        switch (columnName) {
                          case "Image":
                            return (
                              <td
                                key={columnName}
                                className={styles.tableSm}
                                style={{ position: "relative" }}
                              >
                                <img
                                  style={{
                                    objectFit: "contain",
                                    backgroundColor: "white",
                                  }}
                                  src={item[0].image}
                                  alt={`Item ${index + 1}`}
                                />
                              </td>
                            );
                          case "Description":
                            return (
                              <td key={columnName} style={{ minWidth: "100px" }}>
                                {getDescription(item)}
                              </td>
                            );
                          case "Style":
                            return (
                              <td key={columnName} style={{ minWidth: "100px" }}>
                                {item[0].style}
                              </td>
                            );
                          case "Brand":
                            return (
                              <td key={columnName} style={{ minWidth: "100px" }}>
                                {getBrand(item)}
                              </td>
                            );
                          case "Color":
                            return (
                              <td key={columnName} style={{ minWidth: "100px" }}>
                                {item[0].color}
                              </td>
                            );
                          case "Size":
                            return (
                              <td key={columnName} style={{ minWidth: "100px" }}>
                                {getSize(item)}
                              </td>
                            );
                          case "Quantity":
                            return (
                              <td key={columnName} style={{ minWidth: "100px" }}>
                                {quantity}
                              </td>
                            );
                          case "Box":
                            return boxDict[item[0].boxId?.toString()] ? (
                              <td
                                key={columnName}
                                style={{ minWidth: "100px" }}
                              >
                                {quantity > 0 ? getBox(item) :
                                  <div style={{ cursor: "pointer" }}>N/A</div>}
                              </td>
                            ) : (
                              <td key={columnName} style={{ minWidth: "100px" }}>
                                N/A
                              </td>
                            );
                          case "Location":
                            return (
                              <td key={columnName} style={{ minWidth: "100px" }}>
                                {quantity > 0 ? getLocation(item) : "N/A"}
                              </td>
                            );
                          case "Price":
                            return (
                              <td key={columnName} style={{ minWidth: "100px" }}>
                                {getPrice(item) !== "Multi"
                                  ? `$${getPrice(item)}`
                                  : "Multi"}
                              </td>
                            );
                          case "Visibility":
                            return (
                              <td key={columnName} style={{ minWidth: "100px" }}>
                                {item.every((i) => i.public) ? (
                                  <MdPublic color="green" />
                                ) : item.some((i) => i.public) ? (
                                  <MdPublic color="orange" />
                                ) : (
                                  <MdOutlinePublicOff color="red" />
                                )}
                                {item.every((i) => i.sale) ? (
                                  <HiCash color="blue" />
                                ) : item.some((i) => i.sale) ? (
                                  <HiCash color="orange" />
                                ) : null}
                              </td>
                            );
                          default:
                            return <td key={columnName}></td>;
                        }
                      })}
                      {
                        multiEdit &&
                        <td className={styles.tableSm} onClick={(e) => { e.stopPropagation(); console.log(getKey(item)) }}>

                          <SetAlert keyDict={keyDict} getKey={getKey} item={item} refresh={refresh} />
                        </td>
                      }
                    </tr>)
                })}
              </tbody>
            </table>
          </>
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
                {getVisibleColumns("boxes").map((column) => {
                  const columnName = Object.keys(column)[0];
                  return (
                    <th
                      key={columnName}
                      className={columnName === "Image" ? styles.tableSm : ""}
                    >
                      {columnName}
                    </th>
                  );
                })}
                <th></th> {/* For the copy button column */}
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
                  {getVisibleColumns("boxes").map((column) => {
                    const columnName = Object.keys(column)[0];

                    switch (columnName) {
                      case "Image":
                        return (
                          <td
                            key={columnName}
                            style={{ position: "relative" }}
                            onClick={() => setEditBoxOpen(box)}
                          >
                            <div className={styles.tableSm}>
                              <img src={box.image} alt={`Item ${index + 1}`} />
                            </div>
                          </td>
                        );
                      case "Box Id.":
                        return (
                          <td
                            key={columnName}
                            onClick={() => setEditBoxOpen(box)}
                            style={{ minWidth: "100px" }}
                          >
                            {box.boxId}
                          </td>
                        );
                      case "Description":
                        return (
                          <td
                            key={columnName}
                            onClick={() => setEditBoxOpen(box)}
                            style={{ minWidth: "100px" }}
                          >
                            {box.description.length > 80
                              ? box.description.slice(0, 80) + "..."
                              : box.description}
                          </td>
                        );
                      case "Location":
                        return (
                          <td
                            key={columnName}
                            onClick={() => setEditBoxOpen(box)}
                            style={{ minWidth: "100px" }}
                          >
                            {box.location}
                          </td>
                        );
                      case "Total Quantity":
                        return (
                          <td
                            key={columnName}
                            onClick={() => setEditBoxOpen(box)}
                            style={{ minWidth: "100px" }}
                          >
                            {contentDict[box._id.toString()]?.reduce(
                              (acc, cur) => acc + cur.quantity,
                              0
                            ) || 0}
                          </td>
                        );
                      case "Discount":
                        return (
                          <td
                            key={columnName}
                            onClick={() => setEditBoxOpen(box)}
                            style={{ minWidth: "100px" }}
                          >
                            {contentDict[box._id]
                              ? contentDict[box._id][0].sale
                                ? `${box.discount}%`
                                : "N/A"
                              : "N/A"}
                          </td>
                        );
                      case "Min.":
                        return (
                          <td
                            key={columnName}
                            onClick={() => setEditBoxOpen(box)}
                            style={{ minWidth: "100px" }}
                          >
                            {contentDict[box._id]
                              ? contentDict[box._id][0].sale
                                ? `$${box.minPrice}`
                                : "N/A"
                              : "N/A"}
                          </td>
                        );
                      case "Visibility":
                        return (
                          <td
                            key={columnName}
                            onClick={() => setEditBoxOpen(box)}
                            style={{ minWidth: "100px" }}
                          >
                            {contentDict[box._id] ? (
                              contentDict[box._id][0].public ? (
                                <MdPublic color="green" title="Public" />
                              ) : (
                                <MdOutlinePublicOff color="red" title="Admin Only" />
                              )
                            ) : (
                              <MdOutlinePublicOff color="red" title="Admin Only" />
                            )}
                            {contentDict[box._id] ? (
                              contentDict[box._id][0].sale ? (
                                <HiCash color="blue" title="On Sale" />
                              ) : null
                            ) : null}
                          </td>
                        );
                      default:
                        return <td key={columnName}></td>;
                    }
                  })}
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
          options={options}
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
          options={options}
          deletePopup={() => setPopup("delete")}
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
          deletePopup={() => setPopup("delete")}
          getBox={boxDict}
        />
      )}
      {multiOpen !== null && (
        <MultiOpen
          items={multiOpen}
          onClose={() => setMultiOpen(null)}
          setEditBoxOpen={setEditBoxOpen}
          setEditItemOpen={setEditItemOpen}
          boxDict={boxDict}
          sizeDict={sizeDict}
          descriptionDict={descriptionDict}
          brandDict={brandDict}
        />
      )}
      {groupedView !== null && (
        <GroupedView
          items={filteredGroups[groupedView]}
          onClose={() => setGroupedView(null)}
          boxDict={boxDict}
          sizeDict={sizeDict}
          brandDict={brandDict}
          descriptionDict={descriptionDict}
          setEditBoxOpen={setEditBoxOpen}
          setEditItemOpen={setEditItemOpen}
          refresh={refresh}
          getKey={getKey}
          keyDict={keyDict}
          savedInfo={savedInfo}
          setSavedInfo={setSavedInfo}
          setAddBoxOpen={setAddBoxOpen}
        />
      )}
    </div>
  );
}

export default Inventory;
