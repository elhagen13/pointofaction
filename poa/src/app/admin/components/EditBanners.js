"use client";
import { useState, useEffect, useMemo } from "react";
import styles from "./components.module.css";
import { FaRegEdit, FaUpload, FaTimes } from "react-icons/fa";
import Banners from "@/app/components/admin/banners/uploadBanner";

function EditBanners() {

  return (
    <>
      {editOpen && (
       <Banners onClose={() => setEditOpen(false)}/>
      )}
      <div className={styles.addStore}>
        <div className={styles.titleBar}>
          <div className={styles.title}>Banners</div>
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
              onClick={() => setEditOpen(true)}
            >
              Edit Banners
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default EditBanners;