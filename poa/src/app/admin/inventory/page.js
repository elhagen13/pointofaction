"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import styles from "./inventory.module.css";
import globals from "../globals.module.css"
import { FaList, FaRegCopy } from "react-icons/fa";
import {
  IoSearch,
  IoChevronDown,
  IoAlert,
  IoArrowDown,
  IoArrowUp,
} from "react-icons/io5";
import { BiSelectMultiple } from "react-icons/bi";
import {
  MdPublic,
  MdOutlinePublicOff,
  MdLayers,
  MdViewColumn,
  MdEdit,
} from "react-icons/md";
import { HiCash } from "react-icons/hi";

import AddItem from "./AddItem.js";
import AddBox from "../../components/admin/AddBox.js";
import EditItem from "./EditItem.js";
import EditBox from "./EditBox.js";
import MultiOpen from "./MultiOpen.js";
import GroupedView from "./GroupedView.js";
import ColumnManager from "./components/ColumnManager";
import Image from "@/app/components/Image";

import Popup from "@/app/components/popups/Popup";
import { useUser } from "@clerk/nextjs";

import SetAlert from "./components/SetAlert";
import MultiEdit from "./components/MultiEdit";
import MultiEditBoxes from "./components/MultiEditBoxes";

function Inventory() {
  const params =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const brand = params.get("brand");
  const style = params.get("style");
  const color = params.get("color");
  const size = params.get("size");
  const box = params.get("box");

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
  const [groupedDict, setGroupedDict] = useState({});

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
    "tags",
  ];
  const [selectedSearchOption, setSelectedSearchOption] = useState("all");

  const [options, setOptions] = useState({});
  const [savedInfo, setSavedInfo] = useState({
    addBox: {},
    addItem: {},
  });

  const [keys, setKeys] = useState([]);

  const [popup, setPopup] = useState(null);

  const { user } = useUser();

  const [paginate, setPaginate] = useState(0);
  const [numItemsPage, setNumItemsPage] = useState(15);
  const [numPages, setNumPages] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const [multiEdit, setMultiEdit] = useState(false);
  const [multiEditView, setMultiEditView] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());

  const [multiEditBoxes, setMultiEditBoxes] = useState(false);
  const [multiEditViewBoxes, setMultiEditViewBoxes] = useState(false);
  const [selectedBoxes, setSelectedBoxes] = useState(new Set());

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
      { Tags: false },
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
    console.log(result.data);
    setBoxes(result.data);
  };

  useEffect(() => {
    getBoxes();
  }, [inventory]);

  useEffect(() => {
    console.log("SORT ORDER", sortOrder);
  }, [sortOrder]);

  useEffect(() => {
    getInventory();
    getItemOptions();
    getKeys();
    if (localStorage.getItem("columns"))
      setColumns(JSON.parse(localStorage.getItem("columns")));
    if (localStorage.getItem("sortBy"))
      console.log(typeof localStorage.getItem("sortBy"));
    setSortBy(localStorage.getItem("sortBy"));
    if (localStorage.getItem("sortOrder"))
      console.log("LOCAL STORAGE", localStorage.getItem("sortOrder"));
    setSortOrder(JSON.parse(localStorage.getItem("sortOrder")));
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
    console.log(result.data);
    setKeys(result.data);
  };

  const keyDict = useMemo(() => {
    console.log("changing");
    const dict = {};
    keys.forEach((item) => {
      dict[item.key?.toString()] = item;
    });
    return dict;
  }, [keys]);

  const getKey = (item) => {
    return `${
      item[0]?.brand || brandDict[item[0]?.brandId]?.brand || "No brand"
    }-${item[0].style || "No style"}-${
      item[0]?.size || sizeDict[item[0]?.sizeId]?.size || "No size"
    }-${item[0]?.color}`;
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

  const itemDict = useMemo(() => {
    const dict = {};
    inventory.forEach((item) => {
      dict[item._id] = item;
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

  useEffect(() => {
    if (!box) {
      return;
    }
    if (!boxDict[box]?.items) return;
    setEditBoxOpen(boxDict[box]);
  }, [boxDict]);

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
      const size =
        item.sizeId && sizeDict[item.sizeId.toString()]
          ? sizeDict[item.sizeId.toString()].size.toLowerCase()
          : (item.size || "n/a").toLowerCase();

      // Resolve brand from ID or use direct value
      const brand =
        item.brandId && brandDict[item.brandId.toString()]
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

    //now filter our archived - if its marked as tracked it will have returned
    //this is okay to show but only if it is out of stock
    //if the length of the group is 1 and it is archived or total is 0 it is ok to show
    let modifiedArr = [];
    for (const arr of groupedItems) {
      modifiedArr.push(
        arr.filter((item) => {
          if (arr.length < 1) return true;
          else return !item.archived;
        })
      );
    }

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
              case "tags":
                return item.tags.some((tag) =>
                  tag.tag.toLowerCase().includes(searchTerm)
                );
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
      .map((group) => ({
        group,
        quantity: group.reduce((sum, item) => sum + item.quantity, 0),
      }))
      .sort((a, b) => {
        const getTextForSort = (wrappedGroup, field) => {
          const item = wrappedGroup.group[0];
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
              return wrappedGroup.quantity; // ← Use pre-calculated value
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
              const aHasAlert =
                keyDict[getKey(a.group)]?.quantity !== undefined;
              const bHasAlert =
                keyDict[getKey(b.group)]?.quantity !== undefined;

              if (
                aHasAlert &&
                (keyDict[getKey(a.group)]?.quantity || 0) > aQty &&
                !bHasAlert
              )
                return -1;
              if (
                !aHasAlert &&
                bHasAlert &&
                (keyDict[getKey(b.group)]?.quantity || 0) > bQty
              )
                return 1;

              if (aHasAlert && bHasAlert) {
                return aQty - bQty;
              }

              return aQty - bQty;
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
      .map((wrapped) => wrapped.group)
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

    // Filter out boxes with 0 quantity BEFORE search logic
    boxItems = boxItems.filter((box) => {
      const totalQuantity = (contentDict[box._id.toString()] || []).reduce(
        (acc, item) => acc + item.quantity,
        0
      );
      return totalQuantity > 0;
    });

    // Apply search filter to boxes
    if (searchValue.trim() === "") {
      return boxItems;
    }
    const searchTerm = searchValue.toLowerCase().trim();

    return boxItems.filter((box) => {
      const contents = [
        ...new Set(
          (contentDict[box._id.toString()] || []).map(
            (content) =>
              brandDict[content.brandId]?.brand || content.brand || "N/A"
          )
        ),
      ];
      const brandString = contents.reduce((a, b) => a + " " + b, "");
      const totalQuantity = (contentDict[box._id.toString()] || []).reduce(
        (acc, item) => acc + item.quantity,
        0
      );

      if (totalQuantity == 0) return false;

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

      // Combine all searchable text for this box
      const boxText = [
        box.style || "",
        box.brand || "",
        box.color || "",
        box.description || "",
        totalQuantity.toString() || "",
        box.boxId || "",
        box.location || "",
        brandString || "",
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
    setGroupedDict(dict);
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

  useEffect(() => {
    if (!brand || !style) {
      return;
    }
    const key = `${style.toLowerCase()}, ${brand.toLowerCase()}`;
    if (!groupedDict[key]) return;

    setGroupedView(groupedDict[key]);
  }, [groupedDict]);

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

      const contentData = await contentResponse.json();
      let contents = [];

      contentData.data.forEach((item) => {
        if (item.boxId?.toString() === box._id.toString()) {
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
            price: item[0].price,
          },
        ],
      },
      addItem: { ...savedInfo.addItem },
    });
    setAddBoxOpen(true);
  };

  const handleMouseDown = (e, item, type) => {
    if ((type == "items" && !multiEdit) || (type == "boxes" && !multiEditBoxes))
      return;
    e.preventDefault();
    setIsMouseDown(true);
    console.log(item);

    const newSelected = new Set(
      type == "items" ? selectedItems : selectedBoxes
    );
    let itemIds;
    if (type == "items") {
      itemIds = item.map((i) => i._id);
    } else {
      itemIds = [item._id];
    }

    // Toggle: if any selected, deselect all; otherwise select all
    const anySelected = itemIds.some((id) => newSelected.has(id));
    itemIds.forEach((id) => {
      if (anySelected) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
    });

    type === "items"
      ? setSelectedItems(newSelected)
      : setSelectedBoxes(newSelected);
  };

  const handleMouseEnter = (item, type) => {
    if (isMouseDown && (multiEdit || multiEditBoxes)) {
      const newSelected = new Set(
        type == "items" ? selectedItems : selectedBoxes
      );
      let itemIds;
      if (type == "items") {
        itemIds = item.map((i) => i._id);
      } else {
        itemIds = [item._id];
      }

      const anySelected = itemIds.some((id) => newSelected.has(id));
      itemIds.forEach((id) => {
        if (anySelected) {
          newSelected.delete(id);
        } else {
          newSelected.add(id);
        }
      });
      type == "items"
        ? setSelectedItems(newSelected)
        : setSelectedBoxes(newSelected);
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  return (
    <div
      className={styles.inventoryBackground}
      style={{ color: "black", position: "relative" }}
    >
      {popup && <Popup closePopup={() => setPopup(null)} popupType={popup} />}
      <div className={styles.addSelection}>
        <button className={`${globals.button} ${globals.add}`} onClick={() => setAddItemOpen(true)}>
          Add Item
        </button>
        <button className={`${globals.button} ${globals.add}`} onClick={() => setAddBoxOpen(true)}>
          Add Box
        </button>
      </div>
      <div style={{ overflowX: "scroll" }}>
        <div className={styles.tableFilterer}>
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

          {filter !== "grouped" && (
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                rowGap: "0px",
              }}
            >
              {(filter === "line items" || filter === "boxes") && (
                <>
                  {filter !== "boxes" && (
                    <button
                      
                      className={`${globals.button} ${globals.outline}`}
                      onClick={() => setShowAll(!showAll)}
                      title="See all inventory on/off"
                    >
                      <FaList/> Pagination:{" "}
                      {showAll ? "Off" : "On"}
                    </button>
                  )}
                  {(filter == "line items"
                    ? selectedItems.size > 0
                    : selectedBoxes.size > 0) && (
                    <button
                      title="Select multiple items to edit"
                      className={`${globals.button} ${globals.outline}`}
                      onClick={() => {
                        filter == "line items"
                          ? setMultiEditView(!multiEditView)
                          : setMultiEditViewBoxes(!multiEditViewBoxes);
                      }}
                    >
                      <BiSelectMultiple/> Multi
                      Edit
                    </button>
                  )}
                  <button
                    className={`${globals.button} ${globals.outline}`}
                    title="Edit selected items"
                    onClick={() => {
                      filter == "line items"
                        ? setMultiEdit(!multiEdit)
                        : setMultiEditBoxes(!multiEditBoxes);
                      filter == "line items"
                        ? setSelectedItems(new Set())
                        : setSelectedBoxes(new Set());
                    }}
                  >
                    <MdEdit/> Edit Mode{" "}
                    {filter == "line items"
                      ? multiEdit
                        ? "Off"
                        : "On"
                      : multiEditBoxes
                        ? "Off"
                        : "On"}
                  </button>
                </>
              )}
              <button
                className={`${globals.button} ${globals.outline}`}
                title="Edit order and visibility of columns"
                onClick={() => setColumnManagerOpen(!columnManagerOpen)}
              >
                <MdViewColumn/>
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
        </div>
        <div className={styles.filters}>
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
                  className={globals.button}
                  disabled={filter === "grouped"}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

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
                      src={
                        group.find((item) =>
                          item.color
                            .toLowerCase()
                            .includes(searchValue.toLowerCase())
                        )?.image || group[0].image
                      }
                      style={{ objectFit: "contain" }}
                    />
                    {group.some(
                      (item) =>
                        keyDict[getKey([item])]?.quantity > item.quantity
                    ) && <div className={styles.partialOverlay}></div>}
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
                    {console.log(group)}
                    {group.reduce(
                      (a, b) => a + (b.quantity > 0 ? 1 : 0),
                      0
                    )}{" "}
                    variants found
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
        {filter === "line items" && (
          <div className={globals.tableContainer}>
            <table
              className={`${globals.table} ${globals.gray}`}
            >
              <thead>
                <tr>
                  {multiEdit && <th></th>}

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
                        style={{
                          ...(isSortable && { cursor: "pointer" }),
                        }}
                        onClick={() => {
                          if (isSortable) {
                            const sortValue = columnName
                              .toLowerCase()
                              .replace(" ", "");

                            setSortBy(
                              sortValue === "brand" ? "brand" : sortValue
                            );
                            localStorage.setItem(
                              "sortBy",
                              sortValue === "brand" ? "brand" : sortValue
                            );

                            setSortOrder(
                              sortValue !== "quantity"
                                ? !sortOrder
                                : sortOrder === "alerts"
                                  ? true
                                  : !sortOrder
                                    ? "alerts"
                                    : false
                            );
                            localStorage.setItem(
                              "sortOrder",
                              JSON.stringify(
                                sortValue !== "quantity"
                                  ? !sortOrder
                                  : sortOrder === "alerts"
                                    ? true
                                    : !sortOrder
                                      ? "alerts"
                                      : false
                              )
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
                          ) : (
                            <IoAlert
                              style={{
                                marginLeft: "5px",
                                transform: "translateY(2px)",
                              }}
                            />
                          ))}
                      </th>
                    );
                  })}
                  {multiEdit && <th></th>}
                </tr>
              </thead>
              <tbody onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                {filteredInventory.map((item, index) => {
                  const quantity = item.reduce(
                    (acc, cur) => acc + (!cur.archived ? cur.quantity : 0),
                    0
                  );
                  const uniqueKey = getKey(item);
                  const oneSelected =
                    multiEdit && item.some((i) => selectedItems.has(i._id));

                  return (
                    <tr
                      key={uniqueKey}
                      style={{
                        backgroundColor: oneSelected
                          ? "#b4c9edff"
                          : keyDict[getKey(item)] && quantity === 0
                            ? "#e2aeaaff"
                            : parseInt(keyDict[getKey(item)]?.quantity) >
                                quantity
                              ? "#f1d7a9ff"
                              : "",
                        overflow: "scroll",
                      }}
                      onMouseDown={(e) => handleMouseDown(e, item, "items")}
                      onMouseEnter={() => handleMouseEnter(item, "items")}
                      onClick={() => {
                        if (!multiEdit) {
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
                        }
                      }}
                    >
                      {multiEdit && (
                        <td
                          className={globals.sm}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={item.some((i) => selectedItems.has(i._id))}
                            onChange={(e) => {
                              e.stopPropagation();
                              const newSelected = new Set(selectedItems);
                              item.forEach((i) => {
                                if (e.target.checked) {
                                  newSelected.add(i._id);
                                } else {
                                  newSelected.delete(i._id);
                                }
                              });
                              setSelectedItems(newSelected);
                            }}
                          />
                        </td>
                      )}
                      {getVisibleColumns("lineItems").map((column) => {
                        const columnName = Object.keys(column)[0];

                        switch (columnName) {
                          case "Image":
                            return (
                              <td
                                className={globals.sm}
                                key={columnName}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className={globals.imageContainer}>
                                <Image
                                  image={item[0].image}
                                />
                                </div>
                              </td>
                            );
                          case "Description":
                            return (
                              <td
                                style={{width:"20rem", maxWidth:"25rem"}}
                                className={globals.veryLg}
                                key={columnName}
                              >
                                {getDescription(item)}
                              </td>
                            );
                          case "Style":
                            return (
                              <td
                                key={columnName}
                              >
                                {item[0].style}
                              </td>
                            );
                          case "Brand":
                            return (
                              <td
                                key={columnName}
                              >
                                {getBrand(item)}
                              </td>
                            );
                          case "Color":
                            return (
                              <td
                                key={columnName}
                              >
                                {item[0].color}
                              </td>
                            );
                          case "Size":
                            return (
                              <td
                                key={columnName}
                              >
                                {getSize(item)}
                              </td>
                            );
                          case "Quantity":
                            return (
                              <td
                                key={columnName}
                              >
                                {quantity}
                              </td>
                            );
                          case "Box":
                            return boxDict[item[0].boxId?.toString()] ? (
                              <td
                                key={columnName}
                              >
                                {quantity > 0 ? (
                                  getBox(item)
                                ) : (
                                  <div style={{ cursor: "pointer" }}>N/A</div>
                                )}
                              </td>
                            ) : (
                              <td
                                key={columnName}
                              >
                                N/A
                              </td>
                            );
                          case "Location":
                            return (
                              <td
                                key={columnName}
                              >
                                {quantity > 0 ? getLocation(item) : "N/A"}
                              </td>
                            );
                          case "Price":
                            return (
                              <td
                                key={columnName}
                              >
                                {getPrice(item) !== "Multi"
                                  ? `$${getPrice(item)}`
                                  : "Multi"}
                              </td>
                            );
                          case "Visibility":
                            return (
                              <td
                                key={columnName}
                              >
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

                          case "Tags":
                            return (
                              <td
                                key={columnName}
                                onClick={(e) => e.preventDefault()}
                                className={styles.tagContainer}
                              >
                                {item.map((item) =>
                                  item.tags?.map((i) => (
                                    <div
                                      className={styles.tag}
                                      style={{ backgroundColor: `${i.color}90`, border: `1px solid ${i.color}`}}
                                    >
                                      {i.tag}
                                    </div>
                                  ))
                                )}
                              </td>
                            );
                          default:
                            return <td key={columnName}></td>;
                        }
                      })}
                      {multiEdit && (
                        <td
                          className={globals.sm}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                          }}
                          onMouseEnter={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <SetAlert
                            keyDict={keyDict}
                            getKey={getKey}
                            item={item}
                            refresh={refresh}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {filter === "boxes" && (
          <div className={globals.tableContainer}>
          <table
            className={`${globals.table} ${globals.gray}`}
          >
            <thead>
              <tr>
                {multiEditBoxes && <th></th>}
                {getVisibleColumns("boxes").map((column) => {
                  const columnName = Object.keys(column)[0];
                  return (
                    <th
                      key={columnName}
                    >
                      {columnName}
                    </th>
                  );
                })}
                <th></th> {/* For the copy button column */}
              </tr>
            </thead>
            <tbody onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
              {filteredBoxes.map((box, index) => {
                const oneSelected =
                  multiEditBoxes && selectedBoxes.has(box._id);

                return (
                  <tr
                    key={index}
                    onClick={() => {
                      if (!multiEditBoxes) setEditBoxOpen(box);
                    }}
                    onMouseDown={(e) => handleMouseDown(e, box, "boxes")}
                    onMouseEnter={() => handleMouseEnter(box, "boxes")}
                    style={{
                      backgroundColor: oneSelected
                        ? "#b4c9edff"
                        : "",
                      cursor: "pointer",
                    }}
                  >
                    {multiEditBoxes && (
                      <td
                        className={globals.sm}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedBoxes.has(box._id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            const newSelected = new Set(selectedItems);

                            if (e.target.checked) {
                              newSelected.add(box._id);
                            } else {
                              newSelected.delete(box._id);
                            }

                            setSelectedBoxes(newSelected);
                          }}
                        />
                      </td>
                    )}
                    {getVisibleColumns("boxes").map((column) => {
                      const columnName = Object.keys(column)[0];

                      switch (columnName) {
                        case "Image":
                          return (
                            <td
                              className={globals.sm}
                              key={columnName}
                            >
                              <div className={globals.imageContainer}>
                                <Image
                                  image={box.image}
                                />
                              </div>
                            </td>
                          );
                        case "Box Id.":
                          return (
                            <td key={columnName}>
                              {box.boxId}
                            </td>
                          );
                        case "Description":
                          return (
                            <td key={columnName} style={{minWidth:"20rem", maxWidth:"25rem"}}>
                              {box.description.length > 80
                                ? box.description.slice(0, 80) + "..."
                                : box.description}
                            </td>
                          );
                        case "Location":
                          return (
                            <td key={columnName}>
                              {box.location}
                            </td>
                          );
                        case "Total Quantity":
                          return (
                            <td key={columnName}>
                              {contentDict[box._id.toString()]?.reduce(
                                (acc, cur) => acc + cur.quantity,
                                0
                              ) || 0}
                            </td>
                          );
                        case "Discount":
                          return (
                            <td key={columnName}>
                              {contentDict[box._id]
                                ? contentDict[box._id][0].sale
                                  ? `${box.discount}%`
                                  : "N/A"
                                : "N/A"}
                            </td>
                          );
                        case "Min.":
                          return (
                            <td key={columnName}>
                              {contentDict[box._id]
                                ? contentDict[box._id][0].sale
                                  ? `$${box.minPrice}`
                                  : "N/A"
                                : "N/A"}
                            </td>
                          );
                        case "Visibility":
                          return (
                            <td key={columnName}>
                              {contentDict[box._id] ? (
                                contentDict[box._id][0].public ? (
                                  <MdPublic color="green" title="Public" />
                                ) : (
                                  <MdOutlinePublicOff
                                    color="red"
                                    title="Admin Only"
                                  />
                                )
                              ) : (
                                <MdOutlinePublicOff
                                  color="red"
                                  title="Admin Only"
                                />
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
                    <td onClick={(e) => e.stopPropagation()}>
                      <FaRegCopy onClick={() => duplicateBox(box)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
        {filter === "line items" && (
          <div
            style={{
              width: "100%",
              display: "flex",
              gap: "10px",
              justifyContent: "center",
              padding: "10px",
            }}
          >
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
          </div>
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
          items={
            Array.isArray(groupedView)
              ? groupedView
              : filteredGroups[groupedView]
          }
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
          color={color}
          size={size}
        />
      )}
      {multiEditView && (
        <MultiEdit
          onClose={() => setMultiEditView(false)}
          ids={selectedItems}
          itemDict={itemDict}
          descriptionDict={descriptionDict}
          sizeDict={sizeDict}
          brandDict={brandDict}
          options={options}
          refresh={refresh}
        />
      )}
      {multiEditViewBoxes && (
        <MultiEditBoxes
          onClose={() => setMultiEditViewBoxes(false)}
          ids={Array.from(selectedBoxes)}
          refresh={refresh}
        />
      )}
    </div>
  );
}

export default Inventory;
