"use client";
import { useEffect, useState, useMemo } from "react";

export default function Testing() {
  const [options, setOptions] = useState({});
  const [inventory, setInventory] = useState({});

  const getInventory = async () => {
    const response = await fetch("/api/inventory/item", {
      method: "GET",
    });

    const result = await response.json();

    setInventory(result.data);
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

  useEffect(() => {
    getInventory();
    getItemOptions();
  }, []);

  const sizeDict = useMemo(() => {
    const dict = {};
    if (!options.sizes) return {};
    options.sizes.forEach((item) => {
      dict[item._id.toString()] = item.size;
    });
    return dict;
  }, [options]);

  const descriptionDict = useMemo(() => {
    if (!options.descriptions) return {};
    const dict = {};
    options.descriptions.forEach((item) => {
      dict[item._id.toString()] = item.description;
    });
    return dict;
  }, [options]);

  const brandDict = useMemo(() => {
    if (!options.brands) return {};
    const dict = {};
    options.brands.forEach((item) => {
      dict[item._id.toString()] = item.brand;
    });
    return dict;
  }, [options]);

  useEffect(() => {
    if (!Object.keys(inventory).length || !Object.keys(options).length) {
      return;
    }
    const keyDict = {};
    for (const item of inventory) {
      const key = `${item.style || "No style"}-${item.color || "No color"}-${
        item.size || sizeDict[item.sizeId] || "No size"
      }-${item.brand || brandDict[item.brandId] || "No brand"}-${
        item.description ||
        descriptionDict[item.descriptionId] ||
        "No description"
      }`;
      const itemToPush = {
        inventoryId: item._id,
        quantAvailable: item.quantity,
        reserved: [],
      };

      if (keyDict[key]) {
        keyDict[key].totalQuant += item.quantity;
        keyDict[key].items.push(itemToPush);
      } else {
        keyDict[key] = {
          key: key,
          totalQuant: item.quantity,
          totalReserved: 0,
          items: [itemToPush],
        };
      }
    }
    try {
      for (const entry of Object.values(keyDict)) {
        uploadToCatalog(entry)
      }
    } catch {}
  }, [inventory, sizeDict, descriptionDict, brandDict]);

  const uploadToCatalog = async(entry) => {
    
    const itemResponse = await fetch("/api/catalog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(entry),
      });

      const itemResult = await itemResponse.json();

      if (itemResult.success) {
        console.log("Item created successfully:", itemResult.data);
      }
}

  


  return <div>Checking all inventory...</div>;
}
