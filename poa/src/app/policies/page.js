'use client'
import styles from "./terms.module.css"
import { useState } from "react";

export default function TermsAndConditions() {

  return (
    <div className={styles.termsPage}>
      <div className={styles.title}>Policies</div>
      <div className={styles.text}>
        24 Piece hat order minimum 
        <div className={styles.section}/>
        $25 order Minimum 
        <div className={styles.section}/>
        Garment Printing - 12 piece minimum (No C.O.M.) 
        <div className={styles.section}/>
        Pre-payment IN FULL required for new customers 
        <div className={styles.section}/>
        Items that are back-ordered and are requested by the customer to be billed separately from the original quote may be subject to standalone pricing.
        <div className={styles.section}/>
        Credit and Debit payments will be charged a 3.5% processing fee.
        <div className={styles.section}/>
        All orders are custom...No Returns! Please confirm and check your orders.
        <div className={styles.section}/>
        No claims accepted after 7 days of reciept of product.
        <div className={styles.section}/>
        Customers Own Merchandice - C.O.M., is accepted only with approval. No C.O.M. will be replaced if lost, damaged, or if you are not satisfied.
        <div className={styles.section}/>
        All C.O.M. must be boxed and labeled no loose pieces! Orders with loose pieces will incur a boxing fee TBD.
      </div>

    </div>
  );
}
