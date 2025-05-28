'use client'
import styles from "./terms.module.css"
import { useState } from "react";

export default function TermsAndConditions() {

  return (
    <div className={styles.termsPage}>
      <div className={styles.title}>Terms & Conditions</div>
      <div className={styles.text}>
        <div className={styles.section}>Effective Date: 4/30/25</div>

        Welcome to Point of Action! These Terms and Conditions (“Terms”) govern your use of our website and the purchase of products from our online store. By using our website or making a purchase, you agree to be bound by these Terms. Please read them carefully.

        <div className={styles.section}>1. Introduction</div>
        By accessing and using Point of Action, you agree to comply with these Terms and all applicable laws and regulations. If you do not agree with any part of these Terms, please refrain from using our website.


        <div className={styles.section}>2. Account Registration</div>
        To make purchases, you may be required to create an account. You agree to provide accurate, current, and complete information during the registration process and to update your account information as necessary. You are responsible for maintaining the confidentiality of your account details and for all activities under your account.


        <div className={styles.section}>3. Products</div>
        We make every effort to accurately display the colors, descriptions, and prices of our products. However, due to differences in monitor displays, the actual product you receive may vary slightly from what is shown on the website. All product descriptions are subject to change without notice.


        <div className={styles.section}>4. Orders and Payment</div>
        When you place an order through our website, you agree to purchase the selected items at the price indicated at the time of checkout. We accept various payment methods, including credit cards, debit cards, and other secure payment gateways. All payments must be received before an order is processed.
        Note: We reserve the right to refuse or cancel any order for reasons including, but not limited to, product availability, pricing errors, or suspected fraudulent activity.


        <div className={styles.section}>5. Shipping and Delivery</div>
        We offer shipping to [insert countries or regions]. Shipping fees are calculated at checkout and may vary based on the delivery address and shipping method selected. We will make reasonable efforts to ship your order within the specified time frame, but we are not responsible for delays caused by third-party carriers or customs processing.


        <div className={styles.section}>6. Returns and Exchanges</div>
        We want you to be satisfied with your purchase. If for any reason you are not, we offer a return and exchange policy as follows: <br/>
        • Returns: Products must be returned within [X] days of receipt. Items must be unused, undamaged, and in their original packaging. <br/>
        • Exchanges: You may exchange your product for a different size or color (subject to availability). <br/>
        • Non-returnable items: Gift cards, sale items, and personal items (such as underwear or swimwear) are not eligible for return. 


        <div className={styles.section}>7. Pricing and Availability</div>
        Prices are subject to change without notice. If a product is out of stock or unavailable, we will notify you as soon as possible. We are not liable for any inaccuracies in pricing or product availability.


        <div className={styles.section}>8. User-Generated Content</div>
        You may have the opportunity to leave reviews, comments, or other content on our website. By submitting content, you grant us a perpetual, royalty-free, non-exclusive license to use, modify, and display your content in any media, now or in the future.
        You agree not to submit content that is:
        Offensive, defamatory, or discriminatory
        Infringing upon intellectual property rights
        Illegal or harmful to others
        We reserve the right to remove any content that violates these terms.


        <div className={styles.section}>9. Intellectual Property</div>
        All content on this website, including text, graphics, logos, images, and software, is the property of Point of Action and is protected by copyright, trademark, and other intellectual property laws. You may not use any content without prior written permission.


        <div className={styles.section}>10. Privacy Policy</div>
        Your privacy is important to us. By using our website and making a purchase, you consent to the collection and use of your personal information as outlined in our [Privacy Policy]. Please review our Privacy Policy for more details.


        <div className={styles.section}>11. Limitation of Liability</div>
        To the fullest extent permitted by law, [Your Company Name] is not responsible for any indirect, incidental, special, or consequential damages arising from your use of the website or the purchase of products. Our total liability, whether in contract or tort, shall not exceed the total amount you paid for the product(s) in question.


        <div className={styles.section}>12. Indemnity</div>
        You agree to indemnify, defend, and hold harmless [Your Company Name], its affiliates, directors, employees, and agents from any claim, loss, liability, or expense arising out of your use of the website or your violation of these Terms.


        <div className={styles.section}>13. Governing Law</div>
        These Terms are governed by and construed in accordance with the laws of [Your Country/State]. Any disputes will be resolved exclusively in the courts located in [Jurisdiction], and you consent to the jurisdiction of such courts.


        <div className={styles.section}>14. Changes to Terms</div>
        We reserve the right to modify or update these Terms at any time. Any changes will be posted on this page, and the revised Terms will be effective immediately upon posting. We encourage you to review these Terms periodically.

        <div className={styles.section}>15. Contact Us</div>
        If you have any questions about these Terms and Conditions, please contact us at: <br/>
        • Email: orders@pointofaction.com <br/>
        • Phone: (805) 922-6253 <br/>
        • Address: 2232 South Depot Street, Santa Maria, CA 93455
      </div>

    </div>
  );
}
