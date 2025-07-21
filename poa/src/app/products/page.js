'use client'
import React, { useState, useEffect } from 'react';
import { ShoppingCart} from 'lucide-react';
import styles from './products.module.css';
import CheckoutWrapper from '../components/CheckoutForm';
import stripePromise from '../../lib/stripe';

const ProductCard = ({ product, onCheckout }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    const handleBuyNow = () => {
      onCheckout(product);
    };
  
    return (
      <div 
        className={styles.productCard}
        style={{
          transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Product Image */}
        <div className={styles.imageContainer}>
          <img 
            src={product.imageLink} 
            alt={product.name}
            className={styles.productImage}
            style={{
              transform: isHovered ? 'scale(1.05)' : 'scale(1)'
            }}
          />
        </div>
  
        {/* Product Info */}
        <div className={styles.productInfo}>
          <div>
            <h3 className={styles.productTitle}>{product.name}</h3>
            <p className={styles.productDescription}>
              {product.itemDescription}
            </p>
          </div>
  
          {/* Price and Buy Button - now in bottom-aligned section */}
          <div className={styles.bottomSection}>
            <div className={styles.priceSection}>
              <div className={styles.priceContainer}>
                <span className={styles.price}>${product.price}</span>
                <span className={styles.currency}>USD</span>
              </div>
              <button 
                onClick={handleBuyNow}
                className={styles.buyButton}
              >
                <ShoppingCart className={styles.cartIcon} />
                <span>Buy Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

const ProductsPage = () => {
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([])

  useEffect(() => {
    const getImages = async () => {
      const response = await fetch("/api/saleItems", {
        method: "GET",
      });

      const result = await response.json();
      console.log(result.data)
      setProducts(result.data)
    }
    getImages()
     
  }, [])

  const handleCheckout = async (product) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: product.price,
          productId: product._id,
          productName: product.name,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setClientSecret(data.clientSecret);
        setCheckoutProduct(product);
      } else {
        alert('Error creating payment: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating payment intent');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToProducts = () => {
    setCheckoutProduct(null);
    setClientSecret(null);
  };

  if (checkoutProduct && clientSecret) {
    return (
      <CheckoutWrapper 
        product={checkoutProduct}
        clientSecret={clientSecret}
        onBack={handleBackToProducts}
        stripePromise={stripePromise}
      />
    );
  }

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const filteredProducts = sortedProducts.filter(product => {
    if (filterBy === 'all') return true;
    if (filterBy === 'under-100') return product.price < 100;
    if (filterBy === 'over-100') return product.price >= 100;
    return true;
  });

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.headerTitle}>
            OVERSTOCK SALE
          </h1>
        </div>
      </div>

      {/* Products Grid */}
      <div className={styles.productsSection}>
        <div className={styles.productsGrid}>
          {filteredProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onCheckout={handleCheckout}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.footerContent}>
          <p className={styles.footerText}>
            🔒 Secure payments powered by Stripe 
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;