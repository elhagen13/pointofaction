'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import StripeProvider from '../components/StripeProvider';
import CheckoutForm from '../components/CheckoutForm';
import { getProductById } from '../../lib/products';

export default function Checkout() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  const [product, setProduct] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get product details if productId is provided
    if (productId) {
      const foundProduct = getProductById(productId);
      setProduct(foundProduct);
    }
  }, [productId]);

  // Create payment intent when component mounts
  useEffect(() => {
    if (product || (!productId && !product)) {
      const amount = product ? product.price : 50; // Default $50 if no product
      
      fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount,
          productId: product?.id,
          metadata: {
            productName: product?.name || 'General Purchase'
          }
        }),
      })
        .then(res => res.json())
        .then(data => {
          setClientSecret(data.clientSecret);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error creating payment intent:', err);
          setLoading(false);
        });
    }
  }, [product, productId]);

  const handleSuccess = (paymentIntent) => {
    alert('Payment successful! Thank you for your purchase.');
    console.log('Payment succeeded:', paymentIntent);
    // Redirect to success page or update UI
  };

  const handleError = (error) => {
    alert('Payment failed: ' + error.message);
    console.error('Payment error:', error);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <h1>Checkout</h1>
        <p>Loading payment form...</p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <h1>Checkout</h1>
        <p>Error loading payment form. Please try again.</p>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr',
        gap: '40px',
        alignItems: 'start'
      }}>
        {/* Order Summary */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Order Summary</h2>
          
          {product ? (
            <div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <img 
                  src={product.image} 
                  alt={product.name}
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '4px'
                  }}
                />
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                    {product.name}
                  </h3>
                  <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                    {product.description}
                  </p>
                </div>
              </div>
              
              <div style={{ 
                borderTop: '1px solid #e0e0e0',
                paddingTop: '16px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span>Subtotal:</span>
                  <span>${product.price}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span>Shipping:</span>
                  <span>Free</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  borderTop: '1px solid #e0e0e0',
                  paddingTop: '8px'
                }}>
                  <span>Total:</span>
                  <span>${product.price}</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p>General Purchase: $50.00</p>
            </div>
          )}
        </div>

        {/* Payment Form */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Payment Details</h2>
          
          <StripeProvider clientSecret={clientSecret}>
            <CheckoutForm 
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </StripeProvider>
          
          <div style={{ 
            marginTop: '20px',
            fontSize: '12px',
            color: '#666',
            textAlign: 'center'
          }}>
            <p>🔒 Your payment information is secure and encrypted</p>
            <p>💳 We accept all major credit cards</p>
          </div>
        </div>
      </div>
    </div>
  );
}