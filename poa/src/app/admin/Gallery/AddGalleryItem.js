"use client";
import styles from "./galleryItem.module.css";
import { useState, useEffect, useMemo, useRef } from "react";
import Overlay from "@/app/components/popups/Overlay";
import { FaArrowLeftLong } from "react-icons/fa6";
import {
  MdArrowBackIosNew,
  MdDriveFolderUpload,
  MdModeEdit,
} from "react-icons/md";
import { BeatLoader } from "react-spinners";
import { FaCheckCircle, FaRegEdit } from "react-icons/fa";
import { IoIosArrowDropdown } from "react-icons/io";

function AddGalleryItem({ onClose, handleChange }) {
  const [companies, setCompanies] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [chosenCompany, setChosenCompany] = useState(null);
  const [page, setPage] = useState("main");

  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    const response = await fetch("/api/galleryImages/companies", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();
    setCompanies(result.data);
  };

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) =>
      company.company.includes(companySearch)
    );
  }, [companies, companySearch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const existingCompanyClick = (company) => {
    setCompanySearch(company.company);
    setDropdownOpen(false);
    setChosenCompany(company);
  };

  const checkForMatch = () => {
    const match = companies.find((c) => c.company == companySearch);
    return match ? true : false;
  };

  const handleSubmit = () => {
    if (chosenCompany || checkForMatch()) {
      setPage("exists");
    } else setPage("DNE");
  };

  return (
    <Overlay onClose={onClose} isVisible={true} width={"fit-content"}>
      {page == "main" ? (
        <div className={styles.verticalGap}>
          <h2>Add Gallery Item</h2>
          <h3>Company</h3>
          <div>
            <input
              onClick={() => {
                setCompanySearch("");
                setChosenCompany(null);
                setDropdownOpen(true);
              }}
              className={styles.input}
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              onBlur={checkForMatch}
            />
            {dropdownOpen && (
              <div className={styles.dropdown} ref={dropdownRef}>
                {filteredCompanies.map(
                  (company) =>
                    company && (
                      <span onClick={() => existingCompanyClick(company)}>
                        {company.company}
                      </span>
                    )
                )}
              </div>
            )}
          </div>
          <button
            className={styles.button}
            disabled={!companySearch}
            onClick={handleSubmit}
          >
            continue
          </button>
        </div>
      ) : (
        <AddItem
          companyName={chosenCompany?.company || companySearch}
          addCompany={page == "DNE"}
          onClose={onClose}
          handleChange={handleChange}
        />
      )}
    </Overlay>
  );
}

function AddItem({ companyName, addCompany, onClose, handleChange }) {
  const [logoLink, setLogoLink] = useState("");
  const [finalLogoLink, setFinalLogoLink] = useState("");
  const [imageLink, setImageLink] = useState("");
  const [finalImageLink, setFinalImageLink] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(null);
  const [logoFieldsVisible, setLogoFieldsVisible] = useState(true);
  const [productFieldsVisible, setProductFieldsVisible] = useState(true);
  const [type, setType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const SERVICE_TYPES = [
    "Embroidery",
    "Laser Etching",
    "Vinyl Printing",
    "Patches",
    "Printing",
    "Art Digitizing",
  ];

  const handleUploadImage = async (e, type) => {
    console.log("hello", logoLink, uploading);
    if (uploading) return;
    setUploading(type);
    const file = e.target.files[0];
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/galleryImages/uploadImage", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success && type == "logo") {
        setFinalLogoLink(result.url);
        setLogoFieldsVisible(false);
      } else if (result.success && type == "product") {
        setFinalImageLink(result.url);
        setProductFieldsVisible(false);
      } else {
        setUploadError(result.error || "Upload failed");
      }
    } catch (error) {
      setUploadError("Network error: " + error.message);
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const imageData = {
        company: companyName,
        productImage: finalImageLink,
        companyImage: finalLogoLink || null,
        type: type,
      };

      const response = await fetch("/api/galleryImages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(imageData),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Company created successfully:", data.data);
        console.log("Message:", data.message);
        onClose();
        handleChange();
        return true;
      } else {
        console.error("Error creating company:", data.error);
        console.error("Details:", data.details);
        alert("Error creating company: " + (data.error || "Unknown error"));
        return false;
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: " + error.message);
      setSubmitting(false);
      return false;
    }
  };

  return (
    <div className={styles.verticalGap}>
      <h2>Add Gallery Item to {companyName}</h2>
      {addCompany && (
        <>
          <div className={styles.outerHeader}>
            <div className={styles.innerHeader}>
              <h3>Upload Logo</h3>
              {finalLogoLink && <FaCheckCircle className={styles.check} />}
            </div>
            {finalLogoLink && (
              <IoIosArrowDropdown
                className={`${styles.dropdownButton} ${logoFieldsVisible ? styles.open : styles.closed}`}
                onClick={() => setLogoFieldsVisible(!logoFieldsVisible)}
              />
            )}
          </div>
          <div
            className={`${styles.fields} ${logoFieldsVisible ? styles.visible : styles.hiding}`}
          >
            <h5>Image Link</h5>
            <input
              className={styles.input}
              onBlur={() => {
                if (logoLink !== "") {
                  setFinalLogoLink(logoLink);
                  setLogoFieldsVisible(false);
                }
              }}
              value={logoLink}
              onChange={(e) => setLogoLink(e.target.value)}
            />
            <h5>OR Upload Image</h5>
            <div>
              <input
                type="file"
                accept="image/*"
                className={styles.fileInput}
                onChange={(e) => handleUploadImage(e, "logo")}
                id="file-upload-logo"
              />
              <label htmlFor="file-upload-logo" className={styles.uploadBox}>
                {uploading == "logo" ? (
                  <BeatLoader />
                ) : (
                  <MdDriveFolderUpload size={40} />
                )}
              </label>
            </div>
          </div>
          {finalLogoLink && (
            <div className={styles.imageContainer}>
              <img src={finalLogoLink}></img>
            </div>
          )}
          <span style={{ height: "1rem" }} />
        </>
      )}
      <>
        <div className={styles.outerHeader}>
          <div className={styles.innerHeader}>
            <h3>Upload Product Image</h3>
            {finalImageLink && <FaCheckCircle className={styles.check} />}
          </div>
          {finalImageLink && (
            <IoIosArrowDropdown
              className={`${styles.dropdownButton} ${productFieldsVisible ? styles.open : styles.closed}`}
              onClick={() => setProductFieldsVisible(!productFieldsVisible)}
            />
          )}
        </div>
        <div
          className={`${styles.fields} ${productFieldsVisible ? styles.visible : styles.hiding}`}
        >
          <h5>Image Link</h5>
          <input
            className={styles.input}
            onBlur={() => {
              if (imageLink !== "") {
                setFinalImageLink(imageLink);
                setProductFieldsVisible(false);
              }
            }}
            value={imageLink}
            onChange={(e) => setImageLink(e.target.value)}
          />
          <h5>OR Upload Image</h5>
          <div>
            <input
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={(e) => handleUploadImage(e, "product")}
              id="file-upload-product"
            />
            <label htmlFor="file-upload-product" className={styles.uploadBox}>
              {uploading == "product" ? (
                <BeatLoader />
              ) : (
                <MdDriveFolderUpload size={40} />
              )}
            </label>
          </div>
        </div>
        {finalImageLink && (
          <div className={styles.imageContainer}>
            <img src={finalImageLink}></img>
          </div>
        )}
        <span style={{ height: "1rem" }} />
      </>
      <div className={styles.innerHeader}>
        <h3>Service Type</h3>
        {type && <FaCheckCircle className={styles.check} />}
      </div>
      <select
        className={styles.input}
        value={type}
        onChange={(e) => setType(e.target.value)}
        required
      >
        <option value="">Select a service type</option>
        {SERVICE_TYPES.map((serviceType) => (
          <option key={serviceType} value={serviceType}>
            {serviceType}
          </option>
        ))}
      </select>
      <button
        className={styles.button}
        disabled={
          submitting ||
          !type ||
          !finalImageLink ||
          (addCompany && !finalLogoLink)
        }
        onClick={handleSubmit}
      >
        Submit
      </button>
    </div>
  );
}

function EditGalleryItem({ onClose, handleChange, product }) {
  const [page, setPage] = useState("gallery");
  const [editItem, setEditItem] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [companySearch, setCompanySearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [companyDict, setCompanyDict] = useState({});
  const [imageLink, setImageLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingCompany, setEditingCompany]= useState(null);
  const [logoLink, setLogoLink] = useState("");
  const [deleting, setDeleting] = useState(false)

  const SERVICE_TYPES = [
    "Embroidery",
    "Laser Etching",
    "Vinyl Printing",
    "Patches",
    "Printing",
    "Art Digitizing",
  ];

  const dropdownRef = useRef(null);

  // Fetch companies
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    const response = await fetch("/api/galleryImages/companies");
    const result = await response.json();

    setCompanies(result.data);

    // map _id → company object
    const dict = {};
    result.data.forEach((c) => (dict[c._id] = c));
    setCompanyDict(dict);
  };

  // Filter companies for dropdown
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) =>
      c.company.toLowerCase().includes(companySearch.toLowerCase())
    );
  }, [companies, companySearch]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Upload Image
  const handleUploadImage = async (e, type) => {
    if (uploading) return;
    setUploading(true);

    const file = e.target.files[0];
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/galleryImages/uploadImage", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if(data.success && type == "logo"){
        setEditingCompany((prev) => ({ ...prev, image: data.url }));
        setLogoLink(data.url)
      }
      if (data.success) {
        setEditItem((prev) => ({ ...prev, image: data.url }));
        setImageLink(data.url);
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err) {
      alert("Upload error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Submit Changes
  const handleSubmit = async () => {
    if (submitting || !editItem) return;

    setSubmitting(true);

    try {
      const response = await fetch(`/api/galleryImages/${editItem._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editItem),
      });

      const result = await response.json();

      if (result.success) {
        handleChange();
        onClose();
      } else {
        alert(result.error || "Update failed");
      }
    } catch (error) {
      alert("Server error: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/galleryImages/${editItem._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (result.success) {
        handleChange();
        onClose();
      } else {
        alert(result.error || "Update failed");
      }
    } catch (error) {
      alert("Server error: " + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmitCompany = async () => {
    if (!editingCompany) return;

    setSubmitting(true);

    try {
      const response = await fetch(`/api/galleryImages/companies/${product._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCompany),
      });

      const result = await response.json();

      if (result.success) {
        handleChange();
        onClose();
      } else {
        alert(result.error || "Update failed");
      }
    } catch (error) {
      alert("Server error: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Overlay onClose={onClose} isVisible width={"fit-content"}>
      <div className={styles.verticalGap}>
        {page === "gallery" && (
          <>
            <h2>{product.company} Items</h2>

            <div className={styles.companyGrid}>
              <div className={styles.sampleWork}>
                <img src={product.image || "https://companystores.s3.us-east-1.amazonaws.com/gallery-images/Frame+42.jpg"} alt="logo" />

                <MdModeEdit
                  className={styles.editButton}
                  onClick={() => {
                    setEditingCompany(product);
                    setLogoLink(product.image)
                    setPage("editCompany");
                  }}
                />
              </div>
              {product.items.map((item) => (
                <div className={styles.sampleWork} key={item._id}>
                  <img src={item.image} alt="" />

                  <MdModeEdit
                    className={styles.editButton}
                    onClick={() => {
                      setPage("edit");
                      setEditItem(item);
                      setCompanySearch(
                        companyDict[item.companyId]?.company || ""
                      );
                      setImageLink(item.image);
                    }}
                  />
                </div>
              ))}
              
            </div>
          </>
        )}

        {page === "edit" && editItem && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <h2 style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span
                className={styles.backArrow}
                onClick={() => {
                  setPage("gallery");
                  setEditItem(null);
                }}
              >
                <MdArrowBackIosNew style={{ transform: "translateX(-2px)" }} />
              </span>
              Editing Item
            </h2>

            <div className={styles.horizontalFlex} style={{ minWidth: "70vw" }}>
              <div className={styles.imageContainer} style={{ flexGrow: 1 }}>
                <img src={editItem.image} alt="" />
              </div>

              <div className={styles.verticalFlex} style={{ width: "40%" }}>
                {/* Company */}
                <h3>Company</h3>
                <div>
                  <input
                    className={styles.input}
                    value={companySearch}
                    onClick={() => {
                      setCompanySearch("");
                      setDropdownOpen(true);
                    }}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    onBlur={() => {
                      const match = companies.find(
                        (c) => c.company === companySearch
                      );
                      if (match)
                        setEditItem((prev) => ({
                          ...prev,
                          companyId: match._id,
                          company: match.company,
                        }));
                      else {
                        setEditItem((prev) => ({
                          ...prev,
                          company: companySearch,
                        }));
                        delete editItem.companyId;
                      }
                    }}
                  />

                  {dropdownOpen && (
                    <div className={styles.dropdown} ref={dropdownRef}>
                      {filteredCompanies.map((company) => (
                        <span
                          key={company._id}
                          onClick={() => {
                            setCompanySearch(company.company);
                            setDropdownOpen(false);
                            setEditItem((prev) => ({
                              ...prev,
                              companyId: company._id,
                              company: company.company,
                            }));
                          }}
                        >
                          {company.company}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Image Upload */}
                <h3>Upload Product Image</h3>
                <div className={styles.fields}>
                  <h5>Image Link</h5>
                  <input
                    className={styles.input}
                    value={imageLink}
                    onChange={(e) => setImageLink(e.target.value)}
                    onBlur={() =>
                      setEditItem((prev) => ({ ...prev, image: imageLink }))
                    }
                  />

                  <h5>OR Upload Image</h5>
                  <input
                    type="file"
                    accept="image/*"
                    id="file-upload-product"
                    className={styles.fileInput}
                    onChange={handleUploadImage}
                  />
                  <label
                    htmlFor="file-upload-product"
                    className={styles.uploadBox}
                  >
                    {uploading ? (
                      <BeatLoader />
                    ) : (
                      <MdDriveFolderUpload size={40} />
                    )}
                  </label>
                </div>

                {/* Service Type */}
                <h3>Service Type</h3>
                <select
                  className={styles.input}
                  value={editItem.type || ""}
                  onChange={(e) =>
                    setEditItem((prev) => ({ ...prev, type: e.target.value }))
                  }
                >
                  <option value="">Select a service type</option>
                  {SERVICE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                {/* Save Button */}
                <div className={styles.spaceApart}>
                <button
                  className={styles.button}
                  style={{backgroundColor:"#be6c6cff"}}
                  onClick={handleDelete}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
                <button
                  className={styles.button}
                  disabled={
                    submitting ||
                    !editItem.type ||
                    !editItem.image ||
                    (!editItem.company && !editItem.companyId)
                  }
                  onClick={handleSubmit}
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {page === "editCompany" && (
          <div className={styles.verticalGap}>
            <h2 style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span
                className={styles.backArrow}
                onClick={() => {
                  setPage("gallery");
                  setEditItem(null);
                }}
              >
                <MdArrowBackIosNew style={{ transform: "translateX(-2px)" }} />
              </span>
              Editing {product.company}
            </h2>
            <h3>Company Name</h3>
            <input className={styles.input} value={editingCompany.company} onChange={(e) => setEditingCompany({...editingCompany, company: e.target.value})}></input>
            
            <h3>Upload Logo</h3>          
            <div
              className={`${styles.fields}`}
            >
              <h5>Image Link</h5>
              <input
                className={styles.input}
                onBlur={() => {
                  if (logoLink !== "") {
                    setEditingCompany({...editingCompany, image: logoLink});
                  }
                }}
                value={logoLink}
                onChange={(e) => setLogoLink(e.target.value)}
              />
              <h5>OR Upload Image</h5>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  className={styles.fileInput}
                  onChange={(e) => handleUploadImage(e, "logo")}
                  id="file-upload-logo"
                />
                <label htmlFor="file-upload-logo" className={styles.uploadBox}>
                  {uploading == "logo" ? (
                    <BeatLoader />
                  ) : (
                    <MdDriveFolderUpload size={40} />
                  )}
                </label>
              </div>
            </div>
            {editingCompany.image && (
              <div className={styles.imageContainer}>
                <img src={editingCompany.image}></img>
              </div>
            )}
            <button
                  className={styles.button}
                  disabled={
                    submitting || !editingCompany.company || !editingCompany.image
                  }
                  onClick={handleSubmitCompany}
                >
                  {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </Overlay>
  );
}

export default function GalleryItems() {
  const [images, setImages] = useState([]);
  const [addGalleryItemOpen, setAddGalleryItemOpen] = useState(false);
  const [editGalleryItemOpen, setEditGalleryItemOpen] = useState(null);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState({});
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredImages = useMemo(() => {
    if (!search.trim()) {
      return images;
    }

    const searchLower = search.toLowerCase();
    return images.filter((image) => {
      const companyMatch = image.company.toLowerCase().includes(searchLower);
      const typeMatch = image.type.toLowerCase().includes(searchLower);

      return companyMatch || typeMatch;
    });
  }, [images, search]);

  useEffect(() => {
    getAllImages();
  }, []);

  const handleChange = () => {
    getAllImages();
  };

  async function getAllImages() {
    try {
      const response = await fetch("/api/galleryImages");
      const data = await response.json();

      if (data.success) {
        console.log("Images:", data.data);
        setImages(data.data);
      } else {
        console.error("Error:", data.error);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  }
  console.log(images);

  return (
    <>
      {addGalleryItemOpen && (
        <AddGalleryItem
          onClose={() => setAddGalleryItemOpen(false)}
          handleChange={handleChange}
        />
      )}
      {editGalleryItemOpen && (
        <EditGalleryItem
          product={editGalleryItemOpen}
          onClose={() => setEditGalleryItemOpen(false)}
          handleChange={handleChange}
        />
      )}
      <div className={styles.addStore}>
        <div className={styles.titleBar}>
          <div className={styles.title}>Product Images</div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "15px",
            }}
          >
            <button
              className={styles.button}
              style={{
                border: "2px solid #538561",
                backgroundColor: "white",
                color: "#538561",
              }}
              onClick={() => setGalleryOpen(!galleryOpen)}
            >
              {galleryOpen ? "Hide Products" : "View Products"}
            </button>
            <button
              className={styles.button}
              onClick={() => setAddGalleryItemOpen(true)}
            >
              Add Image
            </button>
          </div>
        </div>
        <div className={styles.grid}>
          {galleryOpen &&
            filteredImages.map((company, index) => (
              <div
                className={styles.gridItem}
                key={index}
                onClick={() => setEditGalleryItemOpen(company)}
              >
                <div className={styles.imageContainer}>
                  <img
                    src={company.image || "https://companystores.s3.us-east-1.amazonaws.com/gallery-images/Frame+42.jpg"}
                    className={styles.companyImage}
                    alt={company.company}
                  />
                </div>
                <div className={styles.companyName}>{company.company}</div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
