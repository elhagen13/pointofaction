"use client";
import styles from "./saleBanner.module.css";
import Link from "next/link";
import { IoMdClose } from "react-icons/io";


const SaleBanner = ({toggleOff}) => {
    const handleClickOff = (e) => {
        if (e.target === e.currentTarget) {
            toggleOff();
          }
    }

    const handleExit = () => {
      toggleOff();
    }


  return (
    <div className={styles.background} onClick={handleClickOff}>
      <div className={styles.popup}>
        <div  className={styles.exit} onClick={handleExit}>
          <IoMdClose/>
        </div>
        <div className={styles.text}>
          Overstock Items <br /> For Sale <br /> NOW
        </div>
        <Link href="" className={styles.styledButton}>
           GO →
        </Link>
        <div className={styles.container}>
          <div className={`${styles.scroll} ${styles.scrollOne}`}>
            <div className={styles.item}>HEAVILY DISCOUNTED OVERSTOCKED ITEMS!</div>
            <div className={styles.item}>BIG SALE!</div>
            <div className={styles.item}>FIRST COME FIRST SERVED!</div>
            <div className={styles.item}>HEAVILY DISCOUNTED OVERSTOCKED ITEMS!</div>
            <div className={styles.item}>BIG SALE!</div>
            <div className={styles.item}>FIRST COME FIRST SERVED!</div>
            <div className={styles.item}>HEAVILY DISCOUNTED OVERSTOCKED ITEMS!</div>
            <div className={styles.item}>BIG SALE!</div>
            <div className={styles.item}>FIRST COME FIRST SERVED!</div>
          </div>
          <div className={`${styles.scroll} ${styles.scrollTwo}`}>
          <div className={styles.item}>HEAVILY DISCOUNTED OVERSTOCKED ITEMS!</div>
            <div className={styles.item}>BIG SALE!</div>
            <div className={styles.item}>FIRST COME FIRST SERVED!</div>
            <div className={styles.item}>HEAVILY DISCOUNTED OVERSTOCKED ITEMS!</div>
            <div className={styles.item}>BIG SALE!</div>
            <div className={styles.item}>FIRST COME FIRST SERVED!</div>
            <div className={styles.item}>HEAVILY DISCOUNTED OVERSTOCKED ITEMS!</div>
            <div className={styles.item}>BIG SALE!</div>
            <div className={styles.item}>FIRST COME FIRST SERVED!</div>
          </div>
          <div className={styles.fade}></div>
        </div>
        </div>
    </div>
  );
};

export default SaleBanner;