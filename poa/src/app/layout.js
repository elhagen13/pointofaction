import { Geist, Geist_Mono, Montserrat, Inter, Lato, Roboto } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer"
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'

const lato = Lato({
  weight: ['400', '700'], // Example weights
  subsets: ['latin'],
  variable: '--font-lato', // Optional CSS variable name
});

const montserrat = Montserrat({
  weight: ['400', '700'], // Example: Regular and Bold
  subsets: ['latin'], // Or other subsets like 'cyrillic', 'greek', etc.
  display: 'swap',
  fallback: ['Arial', 'sans-serif'], // Optional fallback font
});


const inter = Inter({
  subsets: ['latin'], // Specify the subsets you need
  variable: '--font-inter', // Optional: Define a CSS variable for the font
});

const roboto = Roboto({
  weight: ['400', '700'], // Optional: Specify font weights
  subsets: ['latin'],    // Optional: Specify subsets (e.g., 'latin')
  display: 'swap',      // Optional:  Use 'swap' for faster loading
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Point of Action",
  icons: {
    icon: '/logo.png'
  }
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
    <html lang="en">
      <body className={`${roboto.className}`} style={{backgroundColor: "white"}}>
        <Navbar/>
        <div style={{minHeight: "calc(100vh - 100px)"}}>
          {children}
        </div>
        <Footer/>
      </body>
    </html>
    </ClerkProvider>
  );
}
