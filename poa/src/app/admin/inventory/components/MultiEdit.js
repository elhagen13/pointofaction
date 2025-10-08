"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import Overlay from "@/app/components/popups/Overlay";
import styles from "../inventory.module.css"

export default function MultiEdit({ onClose, ids, itemDict, descriptionDict, brandDict, sizeDict, options }) {
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [popup, setPopup] = useState(null);
    const [items, setItems] = useState([]);
    const [descriptionSearch, setDescriptionSearch] = useState("");
    const [brandSearch, setBrandSearch] = useState("")
    const [sizeSearch,setSizeSearch] = useState("")


    useEffect(() => {
        setItems([...ids].map(id => itemDict[id]))
    }, [ids, itemDict])

    const filteredDescriptions = useMemo(() => {
        if (!options?.descriptions) return [];
        if (!descriptionSearch || !descriptionSearch.trim()) {
            return options.descriptions;
        }
        return options.descriptions.filter((desc) =>
            desc.description.toLowerCase().includes(descriptionSearch.toLowerCase())
        );
    }, [options?.descriptions, descriptionSearch]);

    const filteredBrands = useMemo(() => {
        if (!options?.brands) return [];
        if (!brandSearch || !brandSearch.trim()) {
            return options.brands;
        }
        return options.brands.filter((desc) =>
            desc.brand.toLowerCase().includes(brandSearch.toLowerCase())
        );
    }, [options?.brands, brandSearch]);

    const filteredSizes = useMemo(() => {
        if (!options?.sizes) return [];
        if (!sizeSearch || !sizeSearch.trim()) {
            return options.sizes;
        }
        return options.sizes.filter((desc) =>
            desc.size.toLowerCase().includes(sizeSearch.toLowerCase())
        );
    }, [options?.sizes, sizeSearch]);


    const DROPDOWN_CONFIGS = {
        description: {
            searchState: descriptionSearch,
            setSearchState: setDescriptionSearch,
            filteredOptions: filteredDescriptions,
            dictionary: descriptionDict,
            fieldKey: "description",
            idKey: "descriptionId",
            openKey: "descriptionOpen",
            placeholder: "Search descriptions...",
            noResultsText: "No descriptions found",
        },
        brand: {
            searchState: brandSearch,
            setSearchState: setBrandSearch,
            filteredOptions: filteredBrands,
            dictionary: brandDict,
            fieldKey: "brand",
            idKey: "brandId",
            openKey: "brandOpen",
            placeholder: "Search brands...",
            noResultsText: "No brands found",
        },
        size: {
            searchState: sizeSearch,
            setSearchState: setSizeSearch,
            filteredOptions: filteredSizes,
            dictionary: sizeDict,
            fieldKey: "size",
            idKey: "sizeId",
            openKey: "sizeOpen",
            placeholder: "Search sizes...",
            noResultsText: "No sizes found",
        },
    };


    return (

        <Overlay
            onClose={onClose}
            isVisible={true}
            popup={popup}
            setPopup={setPopup}
            unsavedChanges={unsavedChanges}
            setUnsavedChanges={setUnsavedChanges}
        >
            <h1>Edit {ids.size} items</h1>
            <table className={styles.inventoryTable}
                style={{ borderCollapse: "collapse", borderRadius: "10px" }}>
                <thead>
                    <tr style={{ backgroundColor: "#ebebeb" }}>
                        <th style={{ padding: "10px" }}>Image</th>
                        <th>Description</th>
                        <th>Style</th>
                        <th>Brand</th>
                        <th>Size</th>
                        <th>Color</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        items.map((item, index) => (
                            <tr style={{
                                width: "100%",
                                backgroundColor: index % 2 == 0 ? "#f2f2f2" : "#ebebeb",
                                cursor: "pointer",
                            }}>
                                <td
                                    className={styles.tableSm}
                                    style={{ position: "relative" }}
                                >
                                    <img
                                        style={{
                                            objectFit: "contain",
                                            backgroundColor: "white",
                                        }}
                                        src={item.image}
                                        alt={`Item ${index + 1}`}
                                    />
                                </td>                                <td>{descriptionDict[item.descriptionId]?.description || item.description}</td>
                                <td>{item.style}</td>
                                <td>{brandDict[item.brandId]?.brand || item.brand}</td>
                                <td>{sizeDict[item.sizeId]?.size || item.size}</td>
                                <td>{item.color}</td>
                                <td>{item.quantity}</td>
                                <td>{item.price}</td>

                            </tr>
                        ))
                    }
                    <tr>
                        <td><input /></td>
                        <td><input /></td>
                        <td><input /></td>
                        <td><input /></td>
                        <td><input /></td>
                        <td><input /></td>
                        <td><input /></td>
                        <td><input /></td>


                    </tr>

                </tbody>
            </table>

        </Overlay>
    )

}