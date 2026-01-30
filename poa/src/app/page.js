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
            className={styles.saleBanner}
          >
            <div>
              <div>
                HEAVILY DISCOUNTED OVERSTOCKED ITEMS!
              </div>
              <div>BIG SALE!</div>
              <div>FIRST COME FIRST SERVED!</div>
              <div
                style={{ textDecoration: "underline" }}
              >
                CLICK HERE!
              </div>
            </div>
            <LuExternalLink/>
          </Link>
        )}
        <Calendar />
        <main className={styles.main}>
          <section
            id="services"
            className={styles.homeItem}
          >
            <h2 className={styles.title}>Services</h2>
            <Link href="/services" className={styles.link}>
              <span>Learn more</span>
              <span aria-hidden="true"> →</span>
            </Link>
            <ServicesCarousel />
          </section>
          <section id="sample_works">
            <h2 className={styles.title}>
              Previous works <br /> from customers
            </h2>
            <Link href="/gallery" className={styles.link}>
              <span>Go to full gallery</span>
               <span aria-hidden="true"> →</span>
            </Link>
            <CustomerCarousel />
          </section>
          <section id="about us">
            <h2 className={styles.title}>About Us</h2>
            <div className={styles.aboutUs}>
              <div>
                <img
                  alt="our history"
                  src="/about_us/history.png"
                />
                <div className={styles.aboutUsText}>
                  <h3>Our History </h3>
                  <br />
                  Point of Action opened in 1987 originally as a silk screen
                  business and has expanded and grown in Santa Maria to what it
                  is today – a successful marketing value added reseller on the
                  Central Coast.
                </div>
              </div>
              <div>
                <img
                  alt="image of staff"
                  src="/about_us/staff.png"
                />
                <div className={styles.aboutUsText}>
                  <h3>Our Staff </h3>
                  <br />
                  P.O.A. prides itself on its experienced staff with master
                  embroiderers, graphic designers, sign-makers, and etchers. Our
                  customer service group with friendly, knowledgeable, and
                  professional personnel, will suggest ideas to help you stand
                  out with the most impact in todays market.
                </div>
              </div>
              <div>
                <img
                  alt="our process"
                  src="/about_us/process.png"
                />
                <div className={styles.aboutUsText}>
                  <h3>Our Process </h3>
                  <br />
                  We supply embroidery and more for many businesses in the state
                  of California as well as companies known nationally. The first
                  step in any order is to give us a call, and we are always
                  standing by to receive you.
                </div>
              </div>
            </div>
          </section>
        </main>
        <footer className={styles.footer}></footer>
      </div>
    </>
  );
}
