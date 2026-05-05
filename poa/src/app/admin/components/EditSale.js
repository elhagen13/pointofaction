import { useState, useEffect } from "react";
import styles from "./components.module.css";

export default function EditSale() {
  const [saleActive, setSaleActive] = useState(false);
  const [saleLink, setSaleLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaleLoading, setIsSaleLoading] = useState(true);
  const [isUpdatingSale, setIsUpdatingSale] = useState(false);

  // Load current sale data when component mounts
  useEffect(() => {
    loadSaleData();
  }, []);

  const loadSaleData = async () => {
    setIsSaleLoading(true);
    try {
      const response = await fetch("/api/checkSale");
      const data = await response.json();

      if (data.success) {
        setSaleActive(data.data.active || false);
        setSaleLink(data.data.link || "");
      }
    } catch (error) {
      console.error("Error loading sale data:", error);
    } finally {
      setIsSaleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Only require sale link if sale is active
    if (saleActive && !saleLink.trim()) {
      alert("Please provide a sale link when sale is active");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await editSale();
      if (success) {
        loadSaleData();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const editSale = async () => {
    try {
      const saleData = {
        active: saleActive,
        link: saleLink.trim(),
      };

      const response = await fetch("/api/checkSale", {
        method: "PUT", // or PATCH
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saleData),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Sale updated successfully:", data.data);
        return true;
      } else {
        console.error("Error updating sale:", data.error);
        alert("Error updating sale: " + (data.error || "Unknown error"));
        return false;
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: " + error.message);
      return false;
    }
  };

  return (
    <div>
      <div className={styles.title} style={{ marginBottom: "30px" }}>
        Edit Sale Status
      </div>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formInput}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <label>Sale Status</label>{" "}
            <button className={styles.defaultButton} onClick={() => setSaleLink("https://pointofaction.com/store")}>use default</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={saleActive}
                onChange={(e) => setSaleActive(e.target.checked)}
                disabled={isSaleLoading || isUpdatingSale}
              />
              <span className={`${styles.slider} ${styles.round}`}></span>
            </label>
          </div>
        </div>
        {saleActive && (
          <div className={styles.formInput}>
            <label>Sale Link</label>
            <input
              className={styles.input}
              value={saleLink}
              onChange={(e) => setSaleLink(e.target.value)}
              placeholder="https://pointofaction.com"
              disabled={!saleActive || isSaleLoading}
              required={saleActive}
            />
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "20px",
          }}
        >
          <button
            type="submit"
            disabled={isSubmitting || isSaleLoading}
            className={styles.button}
          >
            {isSubmitting ? "Updating..." : "Update Sale"}
          </button>
        </div>
      </form>
    </div>
  );
}
