"use client";

import { MdDragHandle } from "react-icons/md";
import { FaEdit, FaEye, FaEyeSlash, FaUpload } from "react-icons/fa";
import styles from "./uploadBanner.module.css";
import { useState, useEffect, useRef } from "react";
import { BeatLoader } from "react-spinners";
import Banner from "@/app/components/Banner";

export default function Banners({ onClose }) {
  const [page, setPage] = useState("banners");
  const [id, setId] = useState(null)

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div onClick={handleModalClick}>
        {page == "banners" && <BannerList setPage={setPage} setId={setId}/>}
        {page == "add" && <AddBanner setPage={setPage}/>}
        {page == "edit" && <EditBanner id={id} setPage={setPage} />}
      </div>
    </div>
  );
}

const BannerList = ({ setPage, setId }) => {
  const [lists, setLists] = useState({
    active: [],
    inactive: [],
  });

  const [dragItem, setDragItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [visibleFile, setVisibleFile] = useState(null);
  const [coordinates, setCoordinates] = useState([0, 0]);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    const bannerResponse = await fetch(`/api/banners`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await bannerResponse.json();

    const active = [];
    const inactive = [];

    const banners = data.data.sort(function (a, b) {
      return a.index < b.index ? -1 : 1;
    });

    banners.forEach((file) => {
      if (file.active) active.push(file);
      else inactive.push(file);
    });

    setLists({ active, inactive });
  };

  const handleDragStart = (fromList, index) => {
    setDragItem({ fromList, index });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const moveItem = (fromList, toList, fromIndex, toIndex) => {
    setLists((prev) => {
      const source = [...prev[fromList]];
      const [item] = source.splice(fromIndex, 1);

      const baseTarget = fromList === toList ? source : [...prev[toList]];

      let insertIndex = toIndex === null ? baseTarget.length : toIndex;

      if (fromList === toList && fromIndex < insertIndex) {
        insertIndex--;
      }

      let x = baseTarget.splice(insertIndex, 0, item);

      return {
        ...prev,
        [fromList]: source,
        [toList]: baseTarget,
      };
    });
  };

  const handleDropOnRow = (toList, toIndex) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragItem) return;
    moveItem(dragItem.fromList, toList, dragItem.index, toIndex);
    setDragItem(null);
  };

  const handleDropOnListEnd = (toList) => (e) => {
    e.preventDefault();
    if (!dragItem) return;
    moveItem(dragItem.fromList, toList, dragItem.index, null);
    setDragItem(null);
  };

  const saveChanges = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const bannerResponse = await fetch(`/api/banners`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(lists),
      });
      const data = await bannerResponse.json();
    } catch {
    } finally {
      setSubmitting(false);
      fetchBanners();
    }
  };

  const handleVisibilityClick = (e, file) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    const x = e.clientX - rect.left; // position within overlayIn
    const y = e.clientY - rect.top; // position within overlayIn

    if (visibleFile == file) {
      setVisibleFile(null);
      return;
    }
    setVisibleFile(file);
    setCoordinates([x, y]);
  };

  useEffect(() => {
    console.log("Coordinates", coordinates);
  }, [coordinates]);

  return (
    <div className={styles.overlayIn} ref={containerRef}>
      {visibleFile !== null && (
        <div
          className={styles.preview}
          style={{ left: `${coordinates[0]}px`, top: `${coordinates[1]}px` }}
        >
          Mobile
          <img src={visibleFile.mobileImage} className={styles.image} />
          Desktop
          <img src={visibleFile.desktopImage} className={styles.image} />
        </div>
      )}
      <div className={styles.header}>
        <h1>Frontpage Banner</h1>
        <button className={styles.button} onClick={() => setPage("add")}>
          Add Banner →
        </button>
      </div>

      <div className={styles.bannerContainer}>
        <h2>Active Banners</h2>
        <div
          className={styles.listSection}
          onDragOver={handleDragOver}
          onDrop={handleDropOnListEnd("active")}
          style={{ minHeight: lists.active.length === 0 ? "80px" : "auto" }}
        >
          {lists.active.length === 0 ? (
            <div style={{ padding: "20px 0", color: "#666" }}>
              Drag banners here to activate them
            </div>
          ) : (
            lists.active.map((file, index) => (
              <div
                key={file.id}
                className={styles.bannerRow}
                draggable
                onDragStart={() => handleDragStart("active", index)}
                onDragOver={handleDragOver}
                onDrop={handleDropOnRow("active", index)}
              >
                <div className={styles.rowElement}>
                  <MdDragHandle />
                  <h3>{file.description}</h3>
                </div>
                 <div className={styles.rowElement}>
                  <FaEdit style={{ cursor: "pointer" }} onClick={() => {setId(file._id); setPage("edit")}}/>
                  {file == visibleFile ? (
                    <FaEyeSlash
                      style={{ cursor: "pointer" }}
                      onClick={(e) => handleVisibilityClick(e, file)}
                    />
                  ) : (
                    <FaEye
                      style={{ cursor: "pointer" }}
                      onClick={(e) => handleVisibilityClick(e, file)}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Inactive list */}
        <h2>Archived Banners</h2>
        <div
          className={styles.listSection}
          onDragOver={handleDragOver}
          onDrop={handleDropOnListEnd("inactive")}
          style={{ minHeight: lists.inactive.length === 0 ? "80px" : "auto" }}
        >
          {lists.inactive.length == 0 ? (
            <div style={{ padding: "20px 0", color: "#666" }}>
              Drag banners here to archive them
            </div>
          ) : (
            lists.inactive.map((file, index) => (
              <div
                key={file.id}
                className={styles.bannerRow}
                draggable
                onDragStart={() => handleDragStart("inactive", index)}
                onDragOver={handleDragOver}
                onDrop={handleDropOnRow("inactive", index)}
              >
                <div className={styles.rowElement}>
                  <MdDragHandle />
                  <h3>{file?.description || "N/A"}</h3>
                </div>
                <div className={styles.rowElement}>
                  <FaEdit style={{ cursor: "pointer" }} onClick={() => {setId(file._id); setPage("edit")}}/>
                  {file == visibleFile ? (
                    <FaEyeSlash
                      style={{ cursor: "pointer" }}
                      onClick={(e) => handleVisibilityClick(e, file)}
                    />
                  ) : (
                    <FaEye
                      style={{ cursor: "pointer" }}
                      onClick={(e) => handleVisibilityClick(e, file)}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <div>
          <h2>Preview</h2>
          <Banner lists={lists} />
        </div>
      </div>
      <button
        className={styles.button}
        style={{ width: "fit-content", marginLeft: "auto" }}
        disabled={submitting}
        onClick={saveChanges}
      >
        {submitting ? <BeatLoader size={8} /> : "Save Changes"}
      </button>
    </div>
  );
};

const AddBanner = ({ setPage }) => {
  const [desktopImage, setDesktopImage] = useState(null);
  const [mobileImage, setMobileImage] = useState(null);
  const [description, setDescription] = useState("");
  const [imageUploading, setImageUploading] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      handleUploadImage(file, type);
    }
  };

  const handleUploadImage = async (file, type) => {
    if (!file) {
      return;
    }
    setImageUploading(type);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/banners/uploadImage", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        if (type === "desktop") {
          setDesktopImage(result.url);
        } else if (type === "mobile") {
          setMobileImage(result.url);
        }
      } else {
        alert("Upload failed");
      }
    } catch (error) {
      alert("Network error: " + error.message);
    } finally {
      setImageUploading(null);
    }
  };

  const handleSubmit = async (e) => {
    setSubmitting(true);
    e.preventDefault();
    try {
      const bannerData = {
        desktopImage: desktopImage,
        mobileImage: mobileImage,
        description: description,
      };

      const bannerResponse = await fetch(`/api/banners`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bannerData),
      });
      const data = await bannerResponse.json();
    } catch {
    } finally {
      setSubmitting(false);
      setPage("banners");
    }
  };

  return (
    <div className={styles.overlayIn}>
      <div className={styles.header}>
        <h1>Add Banner</h1>
        <button className={styles.button} onClick={() => setPage("banners")}>
          ← Return
        </button>
      </div>
      <div className={styles.grid}>
        <div className={styles.photoUploads}>
          <div className={styles.header}>
            <h3>Desktop </h3>
            <h5 style={{ color: "#838282ff" }}>1440 x 430</h5>
          </div>
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e, "desktop")}
              className={styles.fileInput}
              id="file-upload-desktop"
              disabled={imageUploading !== null}
            />
            <label
              htmlFor="file-upload-desktop"
              className={`${styles.upload} ${imageUploading !== null && styles.disabled}`}
            >
              {imageUploading == "desktop" ? (
                <BeatLoader size={"0.5rem"} style={{ height: "100%" }} />
              ) : (
                "Upload"
              )}
            </label>
          </div>
          {desktopImage && <img className={styles.image} src={desktopImage} />}
        </div>
        <div className={styles.photoUploads}>
          <div className={styles.header}>
            <h3>Mobile</h3>
            <h5 style={{ color: "#838282ff" }}>393 x 523</h5>
          </div>
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e, "mobile")}
              className={styles.fileInput}
              id="file-upload-mobile"
              disabled={imageUploading !== null}
            />
            <label
              htmlFor="file-upload-mobile"
              className={`${styles.upload} ${imageUploading !== null && styles.disabled}`}
            >
              {imageUploading == "mobile" ? (
                <BeatLoader size={"0.5rem"} style={{ height: "100%" }} />
              ) : (
                "Upload"
              )}
            </label>
          </div>
          {mobileImage && <img className={styles.image} src={mobileImage} />}
        </div>
      </div>
      <div style={{ gridColumn: "span 2" }}>
        Description:
        <input
          className={styles.formElement}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <button
        className={styles.button}
        style={{ width: "fit-content", marginLeft: "auto" }}
        onClick={(e) => handleSubmit(e)}
        disabled={submitting || !desktopImage || !mobileImage || !description}
      >
        {submitting ? <BeatLoader size={8} /> : "Submit"}
      </button>
    </div>
  );
};

const EditBanner = ({ id, setPage }) => {
  const [desktopImage, setDesktopImage] = useState(null);
  const [mobileImage, setMobileImage] = useState(null);
  const [description, setDescription] = useState("");
  const [imageUploading, setImageUploading] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false)

  const getBannerInfo = async() => {
    setLoading(true)
    const response = await fetch(`/api/banners/${id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    const data = await response.json();

    if(data.data?.desktopImage) setDesktopImage(data.data.desktopImage)
    if(data.data?.mobileImage) setMobileImage(data.data.mobileImage)
    if(data.data?.description) setDescription(data.data.description)
  
    setLoading(false)
  }

  useEffect(() => {
    getBannerInfo();
  }, [])

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      handleUploadImage(file, type);
    }
  };

  const handleUploadImage = async (file, type) => {
    if (!file) {
      return;
    }
    setImageUploading(type);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/banners/uploadImage", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        if (type === "desktop") {
          setDesktopImage(result.url);
        } else if (type === "mobile") {
          setMobileImage(result.url);
        }
      } else {
        alert("Upload failed");
      }
    } catch (error) {
      alert("Network error: " + error.message);
    } finally {
      setImageUploading(null);
    }
  };

  const handleSubmit = async (e) => {
    setSubmitting(true);
    e.preventDefault();
    try {
      const bannerData = {
        desktopImage: desktopImage,
        mobileImage: mobileImage,
        description: description,
      };

      const bannerResponse = await fetch(`/api/banners/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bannerData),
      });
      const data = await bannerResponse.json();
    } catch {
    } finally {
      setSubmitting(false);
      setPage("banners");
    }
  };

  return (
    <div className={styles.overlayIn}>
      <div className={styles.header}>
        <h1>Add Banner</h1>
        <button className={styles.button} onClick={() => setPage("banners")}>
          ← Return
        </button>
      </div>
      {loading ? <BeatLoader style={{marginLeft:"auto", marginRight:"auto"}}/> :
      <>
      <div className={styles.grid}>
        <div className={styles.photoUploads}>
          <div className={styles.header}>
            <h3>Desktop </h3>
            <h5 style={{ color: "#838282ff" }}>1440 x 430</h5>
          </div>
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e, "desktop")}
              className={styles.fileInput}
              id="file-upload-desktop"
              disabled={imageUploading !== null}
            />
            <label
              htmlFor="file-upload-desktop"
              className={`${styles.upload} ${imageUploading !== null && styles.disabled}`}
            >
              {imageUploading == "desktop" ? (
                <BeatLoader size={"0.5rem"} style={{ height: "100%" }} />
              ) : (
                "Upload"
              )}
            </label>
          </div>
          {desktopImage && <img className={styles.image} src={desktopImage} />}
        </div>
        <div className={styles.photoUploads}>
          <div className={styles.header}>
            <h3>Mobile</h3>
            <h5 style={{ color: "#838282ff" }}>393 x 523</h5>
          </div>
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e, "mobile")}
              className={styles.fileInput}
              id="file-upload-mobile"
              disabled={imageUploading !== null}
            />
            <label
              htmlFor="file-upload-mobile"
              className={`${styles.upload} ${imageUploading !== null && styles.disabled}`}
            >
              {imageUploading == "mobile" ? (
                <BeatLoader size={"0.5rem"} style={{ height: "100%" }} />
              ) : (
                "Upload"
              )}
            </label>
          </div>
          {mobileImage && <img className={styles.image} src={mobileImage} />}
        </div>
      </div>
      <div style={{ gridColumn: "span 2" }}>
        Description:
        <input
          className={styles.formElement}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <button
        className={styles.button}
        style={{ width: "fit-content", marginLeft: "auto" }}
        onClick={(e) => handleSubmit(e)}
        disabled={submitting || !desktopImage || !mobileImage || !description}
      >
        {submitting ? <BeatLoader size={8} /> : "Submit"}
      </button>
      </>}
    </div>
  );
};
