import { useState, useEffect, useCallback } from "react";
import Overlay from "@/app/components/popups/Overlay";
import styles from "./companyInventory.module.css";
import { FaLink, FaUpload } from "react-icons/fa";
import Dropdown from "./Dropdown";
import { BeatLoader } from "react-spinners";
import {
  IoIosAddCircleOutline,
  IoIosRemoveCircleOutline,
  IoMdAdd,
} from "react-icons/io";

export default function EditItem({
  item,
  onClose,
  inventory,
  setPopupOuter,
  refresh,
}) {
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [popup, setPopup] = useState(null);
  const [image, setImage] = useState(
    item.image ||
      "https://www.shutterstock.com/image-vector/no-image-available-picture-coming-600nw-2057829641.jpg"
  );
  const [imageUploading, setImageUploading] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [companies, setCompanies] = useState("");
  const [confirmDeletion, setConfirmDeletion] = useState(false);
  const [deletionProgress, setDeletionProgress] = useState(0);

  const [currentItem, setCurrentItem] = useState({
    company: item.company[0].company || "",
    name: item.name || "",
    type: item.type || "",
    material: item.material || "",
    color: item.color || "",
    instances: item.productDetails?.map((instance) => [
      instance.orderId,
      instance.quantity,
      instance.location,
    ]) || ["", 0, ""],
  });

  const [submitting, setSubmitting] = useState(false);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (popup === "successSm" || !unsavedChanges) {
          onClose();
        } else if (unsavedChanges) {
          setPopup("unsaved");
          setUnsavedChanges(false);
        }
      }
    },
    [popup, onClose, unsavedChanges]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    let interval;
    let timeout;

    if (confirmDeletion) {
      // Reset progress
      setDeletionProgress(0);

      // Animate progress bar over 5 seconds
      interval = setInterval(() => {
        setDeletionProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setConfirmDeletion(false)
            return 100;
          }
          return prev + 0.5; 
        });
      }, 10);

      // Reset after 5 seconds
      timeout = setTimeout(() => {
        setDeletionProgress(0);
      }, 5000);
    }

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [confirmDeletion]);

  const handleFileSelect = (e) => {
    setUnsavedChanges(true);
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert("File size must be less than 5MB");
        return;
      }
      handleUploadImage(file);
    }
  };

  const handleUploadImage = async (file) => {
    setUnsavedChanges(true);
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
      console.log(result);
      if (result.success) {
        setImage(result.url);
      } else {
        setPopup("error");
      }
    } catch (error) {
      setPopup("error");
    } finally {
      setImageUploading(false);
    }
  };

  useEffect(() => {
    const companies = {};
    inventory.forEach(
      (item) => (companies[item.company[0].company] = item.company[0])
    );
    setCompanies(Object.keys(companies));
  }, [inventory]);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    const result = await postInventory();
    setSubmitting(false);
    if (result.success) {
      refresh();
      onClose();
      setPopupOuter("successSm");
    }
  };

  const changeCurrentItem = (
    e,
    type,
    instanceTypeIndex = null,
    instanceIndex = null
  ) => {
    setUnsavedChanges(true);
    let val = e.target.value;

    if (type === "instances") {
      // Validate quantity (index 1)
      if (instanceTypeIndex === 1 && val !== "") {
        if (isNaN(val)) return;
      }

      const updatedInstances = currentItem.instances.map((item, i) => {
        if (i !== instanceIndex) return item;

        // Create a new array with the updated value
        const editItem = [...item];
        editItem[instanceTypeIndex] = val;
        return editItem;
      });

      setCurrentItem({
        ...currentItem,
        instances: updatedInstances,
      });
    } else {
      // Handle non-instance fields
      if (type === "quantity" && val !== "") {
        if (isNaN(val)) return;
      }

      setCurrentItem({
        ...currentItem,
        [type]: val,
      });
    }
  };
  const removeInstance = (index) => {
    let instances = currentItem.instances;
    instances = instances.filter((_, i) => i !== index);
    setCurrentItem({
      ...currentItem,
      instances: instances,
    });
  };

  const addInstance = () => {
    let instances = currentItem.instances;
    instances.push(["", 0, ""]);
    setCurrentItem({
      ...currentItem,
      instances: instances,
    });
  };

  const postInventory = async () => {
    const formData = {
      ...currentItem,
      image: image,
      instances: currentItem.instances.map(([orderId, quantity, location]) => ({
        orderId,
        quantity: parseInt(quantity),
        location,
      })),
    };

    const response = await fetch(`/api/companyInventory/${item._id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    const result = await response.json();

    return result;
  };

  const handleDelete = async () => {
    if (!confirmDeletion) {
      setConfirmDeletion(true);
      return;
    }

    const response = await fetch(`/api/companyInventory/${item._id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const result = await response.json();
    console.log(result)
    
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
      <h2>Add Item</h2>
      <div className={styles.grid}>
        <div className={styles.gridLeft}>
          <div className={styles.imagePreview}>
            <img src={image} className={styles.image} />
          </div>
          <div className={styles.uploadOptions}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e)}
              className={styles.fileInput}
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className={`${styles.fileOption} ${styles.fileUpload}`}
            >
              <FaUpload />
            </label>
            OR
            <label
              className={`${styles.fileOption} ${styles.fileUpload}`}
              onClick={() => setShowUrl(!showUrl)}
            >
              <FaLink />
            </label>
          </div>
          {showUrl && (
            <span style={{ position: "relative" }}>
              <input
                style={{ width: "100%", paddingRight: "80px" }}
                className={styles.fileOption}
                placeholder="image url..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <button
                className={styles.imageSubmit}
                onClick={() => {
                  setImage(imageUrl);
                  setShowUrl(false);
                }}
              >
                Submit
              </button>
            </span>
          )}
        </div>
        <div className={styles.form}>
          <div className={styles.innerGrid}>
            <div className={styles.md}>
              <label>Company</label>
              <Dropdown
                currentItem={currentItem}
                options={companies}
                onChange={(value) =>
                  setCurrentItem({ ...currentItem, company: value })
                }
              />
            </div>
            <div className={styles.md}>
              <label>Name</label>
              <input
                className={styles.input}
                value={currentItem.name}
                onChange={(e) => changeCurrentItem(e, "name")}
              />
            </div>
            <div className={styles.sm}>
              <label>Item Type</label>
              <input
                className={styles.input}
                value={currentItem.type}
                onChange={(e) => changeCurrentItem(e, "type")}
              />
            </div>
            <div className={styles.sm}>
              <label>Material</label>
              <input
                className={styles.input}
                value={currentItem.material}
                onChange={(e) => changeCurrentItem(e, "material")}
              />
            </div>
            <div className={styles.sm}>
              <label>Color</label>
              <input
                className={styles.input}
                value={currentItem.color}
                onChange={(e) => changeCurrentItem(e, "color")}
              />
            </div>
            <div
              className={styles.lg}
              style={{ fontWeight: "bold", color: "rgb(167, 167, 167)" }}
            >
              <span
                style={{ backgroundColor: "rgb(167, 167, 167)", height: "2px" }}
              ></span>
              Instances
              <span
                style={{ backgroundColor: "rgb(167, 167, 167)", height: "2px" }}
              ></span>
            </div>
            <div className={`${styles.sm} ${styles.mobile}`}>
              <label>Order Id</label>
            </div>
            <div className={`${styles.sm} ${styles.mobile}`}>
              <label>Quantity</label>
            </div>
            <div className={`${styles.sm} ${styles.mobile}`}>
              <label>Location</label>
            </div>
            {currentItem.instances?.map(([a, b, c], index) => {
              return (
                <>
                  <div
                    className={styles.sm}
                    style={{ flexDirection: "row", alignItems: "center" }}
                  >
                    <IoIosRemoveCircleOutline
                      size={25}
                      onClick={() => removeInstance(index)}
                    />
                    <input
                      className={styles.input}
                      style={{ flexGrow: 1 }}
                      value={a}
                      onChange={(e) =>
                        changeCurrentItem(e, "instances", 0, index)
                      }
                    />
                  </div>
                  <div className={styles.sm}>
                    <input
                      className={styles.input}
                      value={b}
                      onChange={(e) =>
                        changeCurrentItem(e, "instances", 1, index)
                      }
                    />
                  </div>
                  <div className={styles.sm}>
                    <input
                      className={styles.input}
                      value={c}
                      onChange={(e) =>
                        changeCurrentItem(e, "instances", 2, index)
                      }
                    />
                  </div>
                </>
              );
            })}
            <div
              className={styles.lg}
              style={{ display: "flex", alignItems: "center" }}
            >
              <IoIosAddCircleOutline size={25} onClick={addInstance} />
            </div>
          </div>
          <div className={styles.submitButton}>
            <button
              className={styles.slideButton}
              onClick={handleDelete}
              style={{
                "--progress": `${deletionProgress}%`,
              }}
              data-text={confirmDeletion ? "Confirm Deletion?" : "Delete"}
            >
              {confirmDeletion ? "Confirm Deletion?" : "Delete"}
            </button>
            <button
              className={styles.button}
              onClick={handleSubmit}
              disabled={
                submitting ||
                !currentItem.company ||
                !currentItem.type ||
                !currentItem.material ||
                !currentItem.color ||
                currentItem.instances.length < 1
              }
            >
              {submitting ? <BeatLoader size={13} /> : "Save"}
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}
