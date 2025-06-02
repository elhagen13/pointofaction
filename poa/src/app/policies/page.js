'use client'
import styles from "./terms.module.css"
import { useState } from "react";

export default function TermsAndConditions() {

  return (
    <div className={styles.termsPage}>
      <div className={styles.title}>Policies</div>
      <div className={styles.text}>
        <li>24 Piece hat order minimum</li>
        <div className={styles.section}/>
        <li>$25 order Minimum </li>
        <div className={styles.section}/>
        <li>Garment Printing - 12 piece minimum (No C.O.M.)</li>
        <div className={styles.section}/>
        <li>Pre-payment IN FULL required for new customers</li>
        <div className={styles.section}/>
        <li>Items that are back-ordered and are requested by the customer to be billed separately from the original quote may be subject to standalone pricing.</li>
        <div className={styles.section}/>
        <li>Credit and Debit payments will be charged a 3.5% processing fee.</li>
        <div className={styles.section}/>
        <li>All orders are custom...No Returns! Please confirm and check your orders.</li>
        <div className={styles.section}/>
        <li>No claims accepted after 7 days of reciept of product.</li>
        <div className={styles.section}/>
        <li>Customers Own Merchandice - C.O.M., is accepted only with approval. No C.O.M. will be replaced if lost, damaged, or if you are not satisfied.</li>
        <div className={styles.section}/>
        <li>All C.O.M. must be boxed and labeled no loose pieces! Orders with loose pieces will incur a boxing fee TBD.</li>
      </div>

    </div>
  );
}
