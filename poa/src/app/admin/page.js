"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import styles from "./adminHome.module.css";
import EditHours from "./components/EditHours";
import EditSale from "./components/EditSale";
import EditEmails from "./components/EditEmails";
import EditStores from "./components/EditStores"
import EditGallery from "./components/EditGallery"
import EditBanner from "@/app/components/admin/banners/uploadBanner";
import EditVendors from "./components/EditVendors"
import EditCalendar from "./components/EditCalendar";
import EditImages from "./components/EditImages";
import Analytics from "./components/Analytics"
import { IoMdMenu } from "react-icons/io";
import EditEmployees from "./components/EditEmployees";
import { SignOutButton } from '@clerk/nextjs'

export default function AdminHome() {
  const [sliderPosition, setSliderPosition] = useState(null);
  const filters = ["Analytics", "Change Hours", "Sale Status", "Email Recipients", "Company Stores", "Gallery Images", "Banners", "Vendors", "Employees", "Image Bank"];
  const [activeFilter, setActiveFilter] = useState("Analytics");
  const [filterIndex, setFilterIndex] = useState(0);
  const colors = ["#020344", "#08215c", "#0f3f74", "#155e8d", "#1b7ca5", "#229abd", "#28b8d5", "#67d7edff",  "#a5d4deff", "#c5e5edff"];
  const [mobileMenu, setMobileMenu] = useState(false)
  const filterRefs = useRef({});

  const components = {
    "Analytics": <Analytics/>,
    "Change Hours": <EditCalendar/>,
    "Sale Status": <EditSale/>,
    "Email Recipients": <EditEmails/>,
    "Company Stores": <EditStores/>,
    "Gallery Images": <EditGallery/>,
    "Banners": <EditBanner/>,
    "Vendors": <EditVendors/>,
    "Employees": <EditEmployees/>,
    "Image Bank": <EditImages/>
  }

  const updateSliderPosition = useCallback((filterName) => {
    const element = filterRefs.current[filterName];
    if (element) {
      const rect = element.getBoundingClientRect();
      const containerRect = element.parentElement.getBoundingClientRect();

      setSliderPosition({
        width: rect.width,
        height: rect.height,
        left: rect.left - containerRect.left,
        top: rect.top - containerRect.top,
      });
    }
  }, []);

  const changePagination = useCallback(
    (e) => {
      const filterName = e.target.textContent;
      setActiveFilter(filterName);
      updateSliderPosition(filterName);
    },
    [updateSliderPosition]
  );

  // Update slider on mount and resize
  useEffect(() => {
    updateSliderPosition(activeFilter);

    const handleResize = () => updateSliderPosition(activeFilter);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeFilter, updateSliderPosition]);

  return (
    <div className={styles.adminPage}>
        <SignOutButton className={styles.signOut}><button>Sign Out</button></SignOutButton>

      <div className={styles.navContainer}>
      <div  className={styles.mobileMenu} onClick={() => setMobileMenu(!mobileMenu)}><IoMdMenu size={20}/></div>

      <div className={`${styles.paginationType} ${mobileMenu && styles.hidden}`}>
        <div
          className={styles.slider}
          style={{
            width: sliderPosition?.width + 30 || 0,
            height: sliderPosition?.height + 10 || 0,
            left: sliderPosition?.left || 0,
            top: sliderPosition?.top || 0,
            backgroundColor: colors[filterIndex],
          }}
        />
        {filters.map((filter, index) => (
          <div
            key={filter}
            ref={(el) => (filterRefs.current[filter] = el)}
            className={styles.filter}
            style={{ color: activeFilter === filter ? "white" : "black", width:"fit-content", textWrap:"nowrap"}}
            onClick={(e) => {
              changePagination(e);
              setFilterIndex(index);
            }}
            
          >
            {filter}
          </div>
        ))}
      </div>
      </div>
      <div className={styles.contents}>
        {components[activeFilter]}

      </div>
    </div>
  );
}
