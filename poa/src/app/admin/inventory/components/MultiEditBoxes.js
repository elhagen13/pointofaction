"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import Overlay from "@/app/components/popups/Overlay";
import styles from "../inventory.module.css";
import globals from "@/app/admin/globals.module.css";
import { FaUpload, FaLink, FaRegCircle } from "react-icons/fa";
import jsPDF from "jspdf";
import Dropdown from "../Dropdown";
import {
  IoIosCheckmarkCircleOutline,
  IoIosCloseCircleOutline,
  IoIosRemoveCircle,
  IoIosRemoveCircleOutline,
  IoMdQrScanner,
} from "react-icons/io";
import { BeatLoader } from "react-spinners";

export default function MultiEdit({ onClose, ids, refresh }) {
  const DEFAULT_IMAGE =
    "https://companystores.s3.us-east-1.amazonaws.com/sale-items/no-image-available-picture-coming-600nw-2057829641.jpg.webp";
  const boxIds = Array.from(ids);
  const [popup, setPopup] = useState(null);
  const [boxes, setBoxes] = useState([]);
  const [showImageDropdown, setShowImageDropdown] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [currentBox, setCurrentBox] = useState({
    image: DEFAULT_IMAGE,
    location: "",
    public: "",
    sale: "",
    discount: "",
    minPrice: "",
  });

  useEffect(() => {
    fetchBoxes();
  }, []);

  const fetchBoxes = async () => {
    const body = {
      ids: boxIds,
    };
    console.log(body);
    const response = await fetch("/api/inventory/box/multi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    console.log(result);
    if (result.success) {
      setBoxes(result.data);
    } else {
      setPopupMessage(result.message);
    }
  };

  const handleFileUploadOption = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = (e) => handleFileSelect(e);
    fileInput.click();
  };

  const handleFileSelect = (e) => {
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
        setCurrentBox({
          ...currentBox,
          image: result.url,
        });
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
    setCurrentBox({
      ...currentBox,
      image: imageUrlInput,
    });
    setImageUrlInput("");
    setShowUrlInput(false);
    setShowImageDropdown(false);
    setUploadError("");
  };

  const handleSave = async () => {
    setSubmitting(true);

    const changes = {
      boxIds: boxIds,
      ...(currentBox.image !== DEFAULT_IMAGE && { image: currentBox.image }),
      ...(currentBox.location && { location: currentBox.location }),
      ...(currentBox.public && {
        public: currentBox.public == "all" ? true : false,
      }),
      ...(currentBox.sale && { sale: currentBox.sale == "all" ? true : false }),
      ...(currentBox.discount && { discount: parseInt(currentBox.discount) }),
      ...(currentBox.minPrice && { minPrice: parseFloat(currentBox.minPrice) }),
    };

    const response = await fetch("/api/inventory/box/multi", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(changes),
    });

    if (response.ok) {
      fetchBoxes();
      refresh();
      setPopup("success");
      setCurrentBox({
        image: DEFAULT_IMAGE,
        location: "",
        public: "",
        sale: "",
        discount: "",
        minPrice: "",
      });
    } else {
      setPopup("unsuccessful");
    }
    setSubmitting(false);
  };

  const downloadQrs = async () => {
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "in",
        format: [4, 6],
        putOnlyUsedFonts: true,
        compress: true,
      });

      boxes.forEach((box, i) => {
        // Constants
        const pageWidth = 4;
        const pageHeight = 6;
        const qrSize = 2;
        const bottomMargin = 0.5;
        const textStartY = 1.6;
        const lineHeight = 0.2;
        const topMargin = 0.3;

        // Box Location in top right corner
        pdf.setFontSize(20);
        pdf.setFont(undefined, "bold");
        const locationWidth = pdf.getTextWidth(box.location);
        pdf.text(box.location, pageWidth - locationWidth - 0.2, topMargin);

        // Title
        pdf.setFontSize(24);
        pdf.setFont(undefined, "bold");
        pdf.text(`Box ${box?.boxId}`, 2, 1, { align: "center" });

        const maxQrY = pageHeight - qrSize - bottomMargin;
        pdf.setFontSize(12);
        pdf.setFont(undefined, "normal");

        let description = box.description;
        let currentQrY = 2.2;
        const textLines = pdf.splitTextToSize(description, 3.5);
        const textHeight = textLines.length * lineHeight;
        const idealQrY = textStartY + textHeight + 0.3;

        // If QR would go past bottom, truncate text
        if (idealQrY + qrSize > pageHeight - bottomMargin) {
          const availableHeight = maxQrY - textStartY - 0.3;
          const maxLines = Math.floor(availableHeight / lineHeight);

          // Truncate text to fit
          let truncatedText = description;
          let truncatedLines = pdf.splitTextToSize(truncatedText, 3.5);

          while (truncatedLines.length > maxLines && truncatedText.length > 0) {
            truncatedText =
              truncatedText.substring(0, truncatedText.length - 4) + "...";
            truncatedLines = pdf.splitTextToSize(truncatedText, 3.5);
          }

          description = truncatedText;
          currentQrY = maxQrY;
        } else {
          currentQrY = idealQrY;
        }

        pdf.text(description, 2, textStartY, {
          align: "center",
          maxWidth: 3.5,
        });

        const qrX = (pageWidth - qrSize) / 2;
        pdf.addImage(box.qrCode, "PNG", qrX, currentQrY, qrSize, qrSize);
        
        if(i !== boxes.length - 1) pdf.addPage();
      
      });

      pdf.save(`box-qrs.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <Overlay
      onClose={onClose}
      isVisible={true}
      popup={popup}
      setPopup={setPopup}
    >
      <h1
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        Edit Boxes
        <button
          className={`${globals.button} ${globals.green}`}
          onClick={() => downloadQrs()}
        >
          Download QRs <IoMdQrScanner />
        </button>
      </h1>
      <div className={globals.tableContainer}>
        <table className={`${globals.table} ${globals.gray}`}>
          <thead>
            <tr>
              <th>Image</th>
              <th>Box #</th>
              <th>Location</th>
              <th>Public</th>
              <th>Sale</th>
              <th>Discount</th>
              <th>Minimum Price</th>
            </tr>
          </thead>
          <tbody>
            {boxes.map((box, index) => (
              <tr
                style={{
                  backgroundColor: box.selected ? "#cfdcf4ff" : "",
                }}
              >
                <td className={globals.sm}>
                  <div className={globals.imageContainer}>
                    <img
                      src={box.image || DEFAULT_IMAGE}
                      alt={`Item ${index + 1}`}
                    />
                  </div>
                </td>
                <td>{box.boxId}</td>
                <td>{box.location}</td>
                <td>
                  {box.public == "all" ? (
                    <IoIosCheckmarkCircleOutline className={styles.allowed} />
                  ) : box.public == "none" ? (
                    <IoIosCloseCircleOutline className={styles.notAllowed} />
                  ) : (
                    <IoIosRemoveCircleOutline
                      className={styles.sometimesAllowed}
                    />
                  )}
                </td>
                <td>
                  {box.sale == "all" ? (
                    <IoIosCheckmarkCircleOutline className={styles.allowed} />
                  ) : box.sale == "none" ? (
                    <IoIosCloseCircleOutline className={styles.notAllowed} />
                  ) : (
                    <IoIosRemoveCircleOutline
                      className={styles.sometimesAllowed}
                    />
                  )}
                </td>
                <td>{box.discount || "0"}%</td>
                <td>{box.minPrice || "0.00"}</td>
              </tr>
            ))}
            <tr>
              <td className={globals.sm}>
                <div className={globals.imageContainer}>
                  <img
                    src={currentBox.image || DEFAULT_IMAGE}
                    onClick={() => setShowImageDropdown(!showImageDropdown)}
                  />
                </div>
                {showImageDropdown && (
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
                  </div>
                )}
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
                        onClick={(e) => handleUrlSubmit(e)}
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
              <td>N/A</td>
              <td>
                <input
                  className={styles.input}
                  style={{ width: "10rem" }}
                  value={currentBox.location}
                  onChange={(e) =>
                    setCurrentBox({
                      ...currentBox,
                      location: e.target.value,
                    })
                  }
                />
              </td>
              <td>
                <div className={styles.buttonContainer}>
                  <button
                    className={`${styles.boxEditButton} ${currentBox.public == "" && styles.selectedOption}`}
                    style={{ backgroundColor: "#f5f5f5ff" }}
                    onClick={() =>
                      setCurrentBox({
                        ...currentBox,
                        public: "",
                      })
                    }
                  />
                  <button
                    className={`${styles.boxEditButton} ${currentBox.public == "none" && styles.selectedOption}`}
                    onClick={() =>
                      setCurrentBox({
                        ...currentBox,
                        public: "none",
                      })
                    }
                  >
                    <IoIosCloseCircleOutline className={styles.notAllowed} />
                  </button>
                  <button
                    className={`${styles.boxEditButton} ${currentBox.public == "all" && styles.selectedOption}`}
                    onClick={() =>
                      setCurrentBox({
                        ...currentBox,
                        public: "all",
                      })
                    }
                  >
                    <IoIosCheckmarkCircleOutline className={styles.allowed} />
                  </button>
                </div>
              </td>
              <td>
                <div className={styles.buttonContainer}>
                  <button
                    className={`${styles.boxEditButton} ${currentBox.sale == "" && styles.selectedOption}`}
                    style={{ backgroundColor: "#f5f5f5ff" }}
                    onClick={() =>
                      setCurrentBox({
                        ...currentBox,
                        sale: "",
                      })
                    }
                  />
                  <button
                    className={`${styles.boxEditButton} ${currentBox.sale == "none" && styles.selectedOption}`}
                    onClick={() =>
                      setCurrentBox({
                        ...currentBox,
                        sale: "none",
                      })
                    }
                  >
                    <IoIosCloseCircleOutline className={styles.notAllowed} />
                  </button>
                  <button
                    className={`${styles.boxEditButton} ${currentBox.sale == "all" && styles.selectedOption}`}
                    onClick={() =>
                      setCurrentBox({
                        ...currentBox,
                        sale: "all",
                      })
                    }
                  >
                    <IoIosCheckmarkCircleOutline className={styles.allowed} />
                  </button>
                </div>
              </td>
              <td>
                <input
                  className={styles.input}
                  style={{ width: "10rem" }}
                  value={currentBox.discount}
                  onChange={(e) =>
                    !isNaN(e.target.value) &&
                    setCurrentBox({
                      ...currentBox,
                      discount: e.target.value,
                    })
                  }
                />
              </td>
              <td>
                <input
                  className={styles.input}
                  style={{ width: "10rem" }}
                  value={currentBox.minPrice}
                  onChange={(e) =>
                    !isNaN(e.target.value) &&
                    setCurrentBox({
                      ...currentBox,
                      minPrice: e.target.value,
                    })
                  }
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <button
        className={styles.pageButton}
        style={{
          marginLeft: "auto",
          backgroundColor: "white",
        }}
        onClick={handleSave}
      >
        {submitting ? <BeatLoader size={10} /> : "Save"}
      </button>
    </Overlay>
  );
}
