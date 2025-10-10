"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import Overlay from "@/app/components/popups/Overlay";
import styles from "../inventory.module.css"
import { FaUpload, FaLink } from "react-icons/fa";
import Dropdown from "../Dropdown";

export default function MultiEdit({ onClose, ids, itemDict, descriptionDict, brandDict, sizeDict, options, refresh }) {
    const DEFAULT_IMAGE = "https://companystores.s3.us-east-1.amazonaws.com/sale-items/no-image-available-picture-coming-600nw-2057829641.jpg.webp"
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [popup, setPopup] = useState(null);
    const [items, setItems] = useState([]);
    const [descriptionSearch, setDescriptionSearch] = useState("");
    const [brandSearch, setBrandSearch] = useState("")
    const [sizeSearch, setSizeSearch] = useState("")
    const [currentItem, setCurrentItem] = useState({
        image:
            "",
        description: "",
        style: "",
        brand: "",
        size: "",
        color: "",
        quantity: 0,
        price: 0.0,
    });
    const [anyDropdownOpen, setAnyDropdownOpen] = useState(false);
    const [openDropdownCount, setOpenDropdownCount] = useState(0);
    const [showImageDropdown, setShowImageDropdown] = useState(false)

    const [imageUploading, setImageUploading] = useState(false)
    const [uploadError, setUploadError] = useState(false)

    const [showUrlInput, setShowUrlInput] = useState(false)
    const [imageUrlInput, setImageUrlInput] = useState("")


    useEffect(() => {
        setItems([...ids].map(id => {
            const item = itemDict[id]

            return({
                ...item,
                inReservation: item.reserved && item.reserved > 0,
                selected: (item.reserved && item.reserved > 0) ? false : true
            })
            
        }
        ))

    }, [ids, itemDict])

    const toggleSelection = (index) => {
        setItems(items.map((item, i) => {
            if(i === index && !item.inReservation){
                return {
                    ...item,
                    selected: !item.selected
                }
            }
            return item
        }))
    }


    const handleFileUploadOption = () => {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*";
        fileInput.onchange = (e) => handleFileSelect(e);
        fileInput.click();
    };

    const handleFileSelect = (e) => {
        setUnsavedChanges(true);
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                setUploadError("Please select an image file");
                return;
            }
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                setUploadError("File size must be less than 5MB");
                return;
            }
            handleUploadImage(file);
            setUploadError("");
        }
        // Hide image options after selection
        setShowImageDropdown(false);
    };

    const handleUploadImage = async (file) => {
        if (!file) {
            return;
        }
        setImageUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const response = await fetch("/api/inventory/uploadImage", {
                method: "POST",
                body: formData,
            });
            const result = await response.json();
            if (result.success) {
                setCurrentItem({
                    ...currentItem,
                    image: result.url
                })

            } else {
                setUploadError(result.error || "Upload failed");
            }
        } catch (error) {
            setUploadError("Network error: " + error.message);
        } finally {
            setImageUploading(false);
        }
    };

    const handleUrlOption = () => {
        setShowImageDropdown(false);
        setShowUrlInput(true);
    };

    const handleUrlSubmit = (e) => {
        e.preventDefault();
        if (!imageUrlInput.trim()) {
            setUploadError("Please enter a valid URL");
            return;
        }
        // Basic URL validation
        try {
            new URL(imageUrlInput);
        } catch (e) {
            setUploadError("Please enter a valid URL");
            return;
        }
        setCurrentItem({
            ...currentItem,
            image: imageUrlInput
        })
        setImageUrlInput("");
        setShowUrlInput(false);
        setShowImageDropdown(false); // Hide options after URL submission
        setUploadError("");
    };


    const handleDropdownStateChange = useCallback((isOpen) => {
        setOpenDropdownCount(prev => {
            const newCount = isOpen ? prev + 1 : Math.max(0, prev - 1);
            setAnyDropdownOpen(newCount > 0);
            return newCount;
        });
    }, []);


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

    const anyChanges = () => {
        return !currentItem.brand || !currentItem.color || !currentItem.description || !currentItem.image || !currentItem.price 
            || !currentItem.size || !currentItem.style
        
    }

    const onSave = async() => {
        console.log(currentItem, anyChanges())
        items.forEach((item) => {
            if(!item.inReservation && item.selected){
                console.log(item)
            }
        })
    }


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
                style={{ borderCollapse: "collapse", borderRadius: "10px"}}>
                <thead>
                    <tr style={{ backgroundColor: "#ebebeb" }}>
                        <th style={{ padding: "10px" }} className={styles.tableSm}>
                            Image
                        </th>
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
                                backgroundColor: item.inReservation ? "#edb6b6ff": item.selected ? "#cfdcf4ff" : index % 2 == 0 ? "#f2f2f2" : "#ebebeb",
                                cursor: item.inReservation ? "not-allowed" : "pointer",
                            }}
                                onClick={() => toggleSelection(index)}
                            
                            >
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
                                </td>
                                <td>{descriptionDict[item.descriptionId]?.description || item.description}</td>
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
                        <td style={{ padding: "10px", width: "100px" }} className={styles.tableSm}
                        ><img src={currentItem.image || DEFAULT_IMAGE}
                            style={{ width: "50px", position: "relative" }}
                            onClick={() => setShowImageDropdown(!showImageDropdown)}
                            />

                            {showImageDropdown &&
                                <div className={styles.dropdown} data-image-options>
                                    <div
                                        style={{
                                            padding: "8px 12px",
                                            cursor: "pointer",
                                            borderBottom: "1px solid #eee",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                        onClick={() => handleFileUploadOption()}
                                        onMouseEnter={(e) =>
                                            (e.target.style.backgroundColor = "#f5f5f5")
                                        }
                                        onMouseLeave={(e) =>
                                            (e.target.style.backgroundColor = "white")
                                        }
                                        data-image-options
                                    >
                                        <FaUpload style={{ fontSize: "14px" }} />
                                        Upload from Computer
                                    </div>
                                    <div
                                        style={{
                                            padding: "8px 12px",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                        onClick={handleUrlOption}
                                        onMouseEnter={(e) =>
                                            (e.target.style.backgroundColor = "#f5f5f5")
                                        }
                                        onMouseLeave={(e) =>
                                            (e.target.style.backgroundColor = "white")
                                        }
                                        data-image-options
                                    >
                                        <FaLink style={{ fontSize: "14px" }} />
                                        Enter Image URL
                                    </div>
                                </div>}
                            {showUrlInput && (
                                <div
                                    className={styles.dropdown}
                                    style={{
                                        backgroundColor: "white",
                                        border: "1px solid #ccc",
                                        borderRadius: "4px",
                                        padding: "8px",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                        zIndex: 9999,
                                        minWidth: "200px",
                                    }}
                                    data-image-options
                                >
                                    <input
                                        type="text"
                                        value={imageUrlInput}
                                        onChange={(e) => setImageUrlInput(e.target.value)}
                                        placeholder="Enter image URL..."
                                        className={styles.input}
                                        style={{
                                            margin: 0,
                                            width: "100%",
                                            marginBottom: "8px",
                                        }}
                                        data-image-options
                                    />
                                    <div
                                        style={{ display: "flex", gap: "4px" }}
                                        data-image-options
                                    >
                                        <button
                                            type="button"
                                            onClick={(e) =>
                                                handleUrlSubmit(e)
                                            }
                                            style={{
                                                padding: "4px 8px",
                                                fontSize: "12px",
                                                backgroundColor: "#007bff",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "3px",
                                                cursor: "pointer",
                                            }}
                                            data-image-options
                                        >
                                            Use
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowUrlInput(false);
                                                setImageUrlInput("");
                                                setShowImageDropdown(false);
                                            }}
                                            style={{
                                                padding: "4px 8px",
                                                fontSize: "12px",
                                                backgroundColor: "#6c757d",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "3px",
                                                cursor: "pointer",
                                            }}
                                            data-image-options
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </td>
                        <td style={{ padding: "10px 10px 10px 0" }}>
                            <Dropdown
                                configs={DROPDOWN_CONFIGS}
                                config_type={"description"}
                                contents={null}
                                setContents={null}
                                index={null}
                                setUnsavedChanges={setUnsavedChanges}
                                refresh={refresh}
                                currentItem={currentItem}
                                setCurrentItem={setCurrentItem}
                                onDropdownStateChange={handleDropdownStateChange}

                            />
                        </td>
                        <td style={{ padding: "10px 10px 10px 0" }}>
                            <input className={styles.input}
                                value={currentItem.style}
                                onChange={(e) => setCurrentItem({
                                    ...currentItem,
                                    style: e.target.value
                                })}

                            />
                        </td>
                        <td style={{ padding: "10px 10px 10px 0" }}>
                            <Dropdown
                                configs={DROPDOWN_CONFIGS}
                                config_type={"brand"}
                                contents={null}
                                setContents={null}
                                index={null}
                                setUnsavedChanges={setUnsavedChanges}
                                refresh={refresh}
                                currentItem={currentItem}
                                setCurrentItem={setCurrentItem}
                                onDropdownStateChange={handleDropdownStateChange}

                            />
                        </td>
                        <td style={{ padding: "10px 10px 10px 0" }}>
                            <Dropdown
                                configs={DROPDOWN_CONFIGS}
                                config_type={"size"}
                                contents={null}
                                setContents={null}
                                index={null}
                                setUnsavedChanges={setUnsavedChanges}
                                refresh={refresh}
                                currentItem={currentItem}
                                setCurrentItem={setCurrentItem}
                                onDropdownStateChange={handleDropdownStateChange}

                            />
                        </td>
                        <td style={{ padding: "10px 10px 10px 0" }}>
                            <input className={styles.input}
                                value={currentItem.color}
                                onChange={(e) => setCurrentItem({
                                    ...currentItem,
                                    color: e.target.value
                                })}
                            />
                        </td>
                        <td style={{ padding: "10px 10px 10px 0" }}>
                            <input className={styles.input}
                                type="text"
                                pattern="[0-9]*"
                                inputMode="numeric"
                                value={currentItem.quantity}
                                onChange={(e) => setCurrentItem({
                                    ...currentItem,
                                    quantity: parseInt(e.target.value) || ""
                                })}
                            />
                        </td>
                        <td>
                            <input className={styles.input}
                                type="text"
                                pattern="^\d*\.?\d*$"
                                inputMode="decimal"
                                value={currentItem.price}
                                onChange={(e) => setCurrentItem({
                                    ...currentItem,
                                    price: e.target.value
                                })}
                                onBlur={(e) => {
                                    const numValue = parseFloat(e.target.value);
                                    const finalValue = isNaN(numValue)
                                        ? 0
                                        : numValue.toFixed(2);
                                    setCurrentItem({
                                        ...currentItem,
                                        price: finalValue
                                    })
                                }}
                            />
                        </td>


                    </tr>

                </tbody>
            </table>
            <button className={styles.pageButton} style={{
                marginLeft:"auto",
                backgroundColor: "white",
            }}
            onClick={onSave}
            >
                Save
            </button>

        </Overlay>
    )

}