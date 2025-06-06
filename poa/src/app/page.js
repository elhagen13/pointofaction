import Link from "next/link";
import styles from "./page.module.css";
import Banner from "./components/Banner";
import ServicesCarousel from "./components/servicesCarousel";
import CustomerCarousel from "./components/customerCarousel";

export default function Home() {
  return (
    <div>
       <Banner/>
      <main className={styles.main}>
        <div name="services" className={styles.homeItem}>
          <div className={styles.title}>
            Services
          </div>
          <Link href="/services">
            <div className={styles.learnMore}>
              Learn more →
            </div>
          </Link>
          <ServicesCarousel/>

        </div>
        <div name="sample_works" className={styles.homeItem}>
          <div className={styles.title}>
            Works from <br/> previous customers
          </div>
          <Link href="/gallery">
            <div className={styles.learnMore}>
              Go to full gallery →
            </div>
          </Link>
          <CustomerCarousel/>
        </div>
        <div name="about us" className={styles.homeItem}>
          <div className={styles.title}>
            About Us
          </div>
          <div className={styles.aboutUs}>
            <div className={styles.aboutUsItem}>
              <img src="/about_us/history.png" className={styles.aboutUsImage}/>
              <div className={styles.aboutUsText}>
              <div className={styles.subtitle}>Our History </div><br/>
              Point of Action opened in 1987 originally as a silk screen 
              business and has expanded and grown to what it is today – a successful, 
              quality marketing materials manufacturer on the California Central
              Coast
              </div>
            </div>
            <div className={styles.aboutUsItem}>
              <img src="/about_us/staff.png" className={styles.aboutUsImage}/>
              <div className={styles.aboutUsText}>
              <div className={styles.subtitle}>Our Staff </div><br/>
              P.O.A. prides itself on its experienced staff with master embroiderers, 
              graphic designers, sign-makers, etchers, and silk-screeners. Our customer 
              service group with friendly, knowledgeable, and professional personnel, 
              will suggest ideas to help you stand out with the most impact while 
              having a professional look.
              </div>
            </div>
            <div className={styles.aboutUsItem}>
              <img src="/about_us/process.png" className={styles.aboutUsImage}/>
              <div className={styles.aboutUsText}>
              <div className={styles.subtitle}>Our Process </div><br/>
              We supply embroidery and more for many businesses in the state of 
              California as well as companies known nationally. The first step
              in any order is to give us a call, and we are always standing by 
              to receive you.
              </div>
            </div>

          </div>
        </div>
      </main>
      <footer className={styles.footer}>
         
       
      </footer>
    </div>
  );
}
