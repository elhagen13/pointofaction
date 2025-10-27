'use client'
import { useUser } from "@clerk/nextjs"
import { usePathname } from "next/navigation"
import styles from "./adminNavbar.module.css"
import Link from "next/link"

export default function AdminNavbar() {
  const { isSignedIn } = useUser()
  const pathname = usePathname()
  
  // Move conditional logic after hooks
  if (!isSignedIn || !pathname?.includes("/admin")) {
    return null
  }

  // Determine current page from pathname
  const getCurPage = () => {
    if (pathname.includes("/inventory")) return "inventory"
    if (pathname.includes("/reserve") && !pathname.includes("/reservations")) return "reserve"
    if (pathname.includes("/reservations")) return "reservations"
    return "home"
  }
  
  const curPage = getCurPage()

  return (
    <div className={styles.navbar}>
      <div className={styles.linkContainer}>
        <Link 
          href="/admin"
          className={`${styles.link} ${curPage === "home" ? styles.activeLink : ""}`}
        >
          Home
        </Link>
        <Link 
          href="/admin/inventory"
          className={`${styles.link} ${curPage === "inventory" ? styles.activeLink : ""}`}
        >
          Inventory
        </Link>
        <Link 
          href="/admin/reservations"
          className={`${styles.link} ${curPage === "reservations" ? styles.activeLink : ""}`}
        >
          Reservations
        </Link>
        <Link 
          href="/admin/reserve"
          className={`${styles.link} ${curPage === "reserve" ? styles.activeLink : ""}`}
        >
          Reserve
        </Link>
      </div>
    </div>
  )
}