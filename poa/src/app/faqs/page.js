"use client";
import { use } from "react";
import Link from "next/link";
import styles from "./faqs.module.css";

export default function faqPage({ params }) {
  return (
    <div className={styles.faqPage}>
        <h1 className={styles.title}>FAQs</h1>
        <Link href="/howToOrder" className={styles.faq}>
          Looking for how to place an order on the online store?
          <div>→</div>{" "}
        </Link>
        <Link href="/requestPortal" className={styles.faq}>
          Repeat customer looking to create your own company store?
          <div>→</div>{" "}
        </Link>
        <Link href="/notifications" className={styles.faq}>
          Want to opt-in/opt-out of text messages about your order?
          <div>→</div>{" "}
        </Link>
        <Link href="/termsAndConditions" className={styles.faq}>
          Our terms and conditions
          <div>→</div>{" "}
        </Link>
        <Link href="/policies" className={styles.faq}>
          Our policies
          <div>→</div>{" "}
        </Link>
      
    </div>
  );
}
