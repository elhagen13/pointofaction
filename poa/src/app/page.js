"use client";
import Link from "next/link";
import Head from "next/head";
import styles from "./page.module.css";
import Banner from "./components/Banner";
import Calendar from "./components/Calendar";
import ServicesCarousel from "./components/servicesCarousel";
import CustomerCarousel from "./components/customerCarousel";
import SaleBanner from "./components/SaleBanner";
import { useState, useEffect } from "react";
import { LuExternalLink } from "react-icons/lu";

export default function Home() {
  const [saleOpen, setSaleOpen] = useState(false);
  const [sale, setSale] = useState(false);
  const [saleLink, setSaleLink] = useState("");

  useEffect(() => {
    fetch('/api/tracker', {
      method: "POST",
      body: JSON.stringify({
          page:''
      })
    })
  }, [])


  useEffect(() => {
    async function getSaleStatus() {
      try {
        const response = await fetch(`/api/checkSale`);
        if (response.ok) {
          const status = await response.json();
          setSaleOpen(status.data.active);
          setSale(status.data.active);
          setSaleLink(status.data.link);
        } else {
          setSaleOpen(false);
          setSale(false);
        }
      } catch (error) {
        console.error("Error fetching weekly hours:", error);
      }
    }
    getSaleStatus();
  }, []);


  return (
    <>
      <Head>
        <title>
          Point of Action - Embroidery, Signs & Custom Marketing Solutions |
          Santa Maria
        </title>
        <meta
          name="description"
          content="Point of Action has been serving Santa Maria since 1987 with professional embroidery, custom signs, and marketing solutions. Expert staff, quality craftsmanship."
        />
        <meta
          name="keywords"
          content="embroidery, custom signs, laser etching, engraving, laser engraving, marketing, Central Coast, Santa Maria, Nipomo, Arroyo Grande, silk screen, Point of Action"
        />
        <meta
          property="og:title"
          content="Point of Action - Custom Embroidery & Signs"
        />
        <meta
          property="og:description"
          content="Professional embroidery and custom marketing solutions since 1987 in Santa Maria"
        />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://pointofaction.com" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "Point of Action",
              description:
                "Professional embroidery, custom signs, and marketing solutions since 1987",
              foundingDate: "1987",
              url: "https://pointofaction.com",
            }),
          }}
        />
      </Head>
      <div>
        {saleOpen && <SaleBanner link={saleLink} toggleOff={() => setSaleOpen(false)} />}
        <Banner />
        {sale && (
          <Link
            href={saleLink}
            style={{
              backgroundColor: "#FF5D5D",
              width: "100%",
              padding: "15px 10px",
              display: "flex",
              justifyContent: "space-between",
              fontWeight: "bold",
              color: "white",
            }}
            onClick={() => console.log(saleLink)}
          >
            <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
              <div className={styles.item}>
                HEAVILY DISCOUNTED OVERSTOCKED ITEMS!
              </div>
              <div className={styles.item}>BIG SALE!</div>
              <div className={styles.item}>FIRST COME FIRST SERVED!</div>
              <div
                className={styles.item}
                style={{ textDecoration: "underline" }}
              >
                CLICK HERE!
              </div>
            </div>
            <LuExternalLink />
          </Link>
        )}
        <Calendar />
        <main className={styles.main}>
          <div
            name="services"
            className={styles.homeItem}
            style={{ marginTop: "3rem" }}
          >
            <div className={styles.title}>Services</div>
            <Link href="/services">
              <div className={styles.learnMore}>Learn more →</div>
            </Link>
            <ServicesCarousel />
          </div>
          <div name="sample_works" className={styles.homeItem}>
            <div className={styles.title}>
              Previous works <br /> from customers
            </div>
            <Link href="/gallery">
              <div className={styles.learnMore}>Go to full gallery →</div>
            </Link>
            <CustomerCarousel />
          </div>
          <div name="about us" className={styles.homeItem}>
            <div className={styles.title}>About Us</div>
            <div className={styles.aboutUs}>
              <div className={styles.aboutUsItem}>
                <img
                  src="/about_us/history.png"
                  className={styles.aboutUsImage}
                />
                <div className={styles.aboutUsText}>
                  <div className={styles.subtitle}>Our History </div>
                  <br />
                  Point of Action opened in 1987 originally as a silk screen
                  business and has expanded and grown in Santa Maria to what it
                  is today – a successful marketing value added reseller on the
                  Central Coast.
                </div>
              </div>
              <div className={styles.aboutUsItem}>
                <img
                  src="/about_us/staff.png"
                  className={styles.aboutUsImage}
                />
                <div className={styles.aboutUsText}>
                  <div className={styles.subtitle}>Our Staff </div>
                  <br />
                  P.O.A. prides itself on its experienced staff with master
                  embroiderers, graphic designers, sign-makers, and etchers. Our
                  customer service group with friendly, knowledgeable, and
                  professional personnel, will suggest ideas to help you stand
                  out with the most impact in todays market.
                </div>
              </div>
              <div className={styles.aboutUsItem}>
                <img
                  src="/about_us/process.png"
                  className={styles.aboutUsImage}
                />
                <div className={styles.aboutUsText}>
                  <div className={styles.subtitle}>Our Process </div>
                  <br />
                  We supply embroidery and more for many businesses in the state
                  of California as well as companies known nationally. The first
                  step in any order is to give us a call, and we are always
                  standing by to receive you.
                </div>
              </div>
            </div>
          </div>
        </main>
        <footer className={styles.footer}></footer>
      </div>
    </>
  );
}
