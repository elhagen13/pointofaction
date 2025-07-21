// components/CheckoutForm.jsx
import React, { useState } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement,
  Elements,
} from "@stripe/react-stripe-js";
import {
  CheckCircle,
  AlertCircle,
  CreditCard,
  ArrowLeft,
  Car,
  Plus,
  Minus,
  UserRound,
} from "lucide-react";
import styles from "./checkoutForm.module.css";

const CheckoutForm = ({ product, clientSecret, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [shipping, setShipping] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleQuantityChange = async (change) => {
    const newQuantity = Math.max(1, quantity + change);
    setQuantity(newQuantity);
    
    // Update payment intent with new amount
    try {
      const response = await fetch('/api/update-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: clientSecret.split('_secret_')[0], // Extract PI ID
          amount: Math.round(product.price * newQuantity * 100), // Amount in cents
          quantity: newQuantity
        })
      });
      
      if (!response.ok) {
        // Handle error - maybe reset quantity
        setQuantity(quantity);
      }
    } catch (error) {
      console.error('Failed to update payment intent:', error);
      // Reset quantity on error
      setQuantity(quantity);
    }
  };

  const totalPrice = (product.price * quantity).toFixed(2);

  const sendOrderEmail = async (paymentIntent, shippingAddress = null) => {
    try {
        console.log(shippingAddress)

        const formData = new FormData();
        formData.append('formType', 'product-purchase');
        formData.append('name', customerInfo.name);
        formData.append('email', customerInfo.email);
        formData.append('phone', customerInfo.phone);
        formData.append('product', product.name);
        formData.append('price', product.price);
        formData.append('quantity', quantity);
        formData.append('total', totalPrice);
        formData.append('shipping', shipping);
        if(shippingAddress) formData.append('shippingAddress', `${shippingAddress.line1}, ${shippingAddress.city}, ${shippingAddress.state}, ${shippingAddress.postal_code}`);
        formData.append('orderDate', new Date().toISOString());

      const orderData = {
        customer: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone
        },
        product: {
          name: product.name,
          price: product.price,
          quantity: quantity,
          total: totalPrice
        },
        shipping: shipping,
        shippingAddress: shippingAddress,
        paymentIntentId: paymentIntent.id,
        orderDate: new Date().toISOString()
      };

      await fetch('/api/resend', {
        method: 'POST',
        body: formData,
      });

      // Send to your backend API endpoint
      /*await fetch('/api/send-order-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });*/
    } catch (error) {
      console.error('Failed to send order email:', error);
      // Don't block the success flow if email fails
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    // Validate customer info
    if (!customerInfo.name || !customerInfo.email) {
      setErrorMessage("Please fill in your name and email address.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    try {
      // Get shipping address if shipping is enabled
      let shippingAddress = null;
      if (shipping) {
        const addressElement = elements.getElement('address');
        if (addressElement) {
          const { complete, value } = await addressElement.getValue();
          if (complete) {
            shippingAddress = value.address;
          } else {
            setErrorMessage("Please complete the shipping address.");
            setIsProcessing(false);
            return;
          }
        }
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
          payment_method_data: {
            billing_details: {
              name: customerInfo.name,
              email: customerInfo.email,
              phone: customerInfo.phone
            }
          }
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message);
        setPaymentStatus("error");
      } else if (paymentIntent.status === "succeeded") {
        // Send order email to company rep
        await sendOrderEmail(paymentIntent, shippingAddress);
        setPaymentStatus("success");
      }
    } catch (err) {
      setErrorMessage("An unexpected error occurred.");
      setPaymentStatus("error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentStatus === "success") {
    return (
      <div className={styles.successContainer}>
        <CheckCircle className={styles.successIcon} />
        <h2 className={styles.successTitle}>Payment Successful!</h2>
        <p className={styles.successText}>
          Thank you for your purchase of {quantity} x {product.name}
        </p>
        <button onClick={onBack} className={styles.backButton}>
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className={styles.checkoutContainer}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButtonHeader}>
          <ArrowLeft className={styles.backIcon} />
          Back to Products
        </button>
        <h2 className={styles.title}>Checkout</h2>
      </div>

      <div className={styles.content}>
        {/* Product Summary */}
        <div className={styles.productSummary}>
          <img
            src={product.imageLink}
            alt={product.name}
            className={styles.productImage}
          />
          <div className={styles.productInfo}>
            <h3 className={styles.productName}>{product.name}</h3>
            <p className={styles.productDescription}>{product.description}</p>
            
            {/* Quantity Controls */}
            <div className={styles.quantityContainer}>
              <span className={styles.quantityLabel}>Quantity:</span>
              <div className={styles.quantityControls}>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className={`${styles.quantityButton} ${quantity <= 1 ? styles.disabled : ''}`}
                >
                  <Minus size={16} />
                </button>
                <span className={styles.quantityDisplay}>{quantity}</span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock}
                  className={styles.quantityButton}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className={styles.priceContainer}>
              <div className={styles.priceBreakdown}>
                <span className={styles.unitPrice}>${product.price} each</span>
                <span className={styles.totalPrice}>${totalPrice} USD</span>
              </div>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Customer Information */}
          <div className={styles.paymentSection}>
            <div className={styles.paymentHeader}>
              <UserRound className={styles.cardIcon} />
              <h3 className={styles.paymentTitle}>Customer Information</h3>
            </div>
            <div className={styles.customerInfoGrid}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  className={styles.input}
                  placeholder="Enter your full name"
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Email Address *</label>
                <input
                  type="email"
                  required
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                  className={styles.input}
                  placeholder="Enter your email address"
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Phone Number</label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className={styles.input}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
          </div>

          <div className={styles.paymentSection}>
            <div className={styles.testInfo} style={{ margin: "0 0 1rem 0" }}>
              <p className={styles.testTitle}>Shipping or Pickup</p>
              <p className={styles.testText}>
                If you opt to ship, the final cost will be adjusted, however,
                you can also pick up at our Santa Maria location.
              </p>
            </div>
            <h3 className={styles.paymentTitle}>Shipping Opt In/Out</h3>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={shipping}
                onChange={(e) => setShipping(e.target.checked)}
              />
              <span className={`${styles.slider} ${styles.round}`}></span>
            </label>
            { shipping && <>
            <div className={styles.paymentHeader}>
              <Car className={styles.cardIcon} />
              <h3 className={styles.paymentTitle}>Shipping Information</h3>
            </div>

            <div className={styles.paymentElement}>
              <AddressElement
                options={{
                  mode: "shipping",
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "#424770",
                      "::placeholder": {
                        color: "#aab7c4",
                      },
                    },
                  },
                }}
              />
            </div>
            </>}
          </div>

          {/* Payment Form */}
          <div className={styles.paymentSection}>
            <div className={styles.paymentHeader}>
              <CreditCard className={styles.cardIcon} />
              <h3 className={styles.paymentTitle}>Payment Information</h3>
            </div>
            <div className={styles.paymentElement}>
              <PaymentElement
                options={{
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "#424770",
                      "::placeholder": {
                        color: "#aab7c4",
                      },
                    },
                  },
                }}
              />
            </div>

            <div className={styles.testInfo}>
              <p className={styles.testTitle}>Test Mode</p>
              <p className={styles.testText}>
                Use card number 4242 4242 4242 4242 with any future date and CVC
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className={styles.errorMessage}>
              <AlertCircle className={styles.errorIcon} />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!stripe || isProcessing}
            className={`${styles.payButton} ${isProcessing ? styles.processing : ""}`}
          >
            {isProcessing ? (
              <>
                <div className={styles.spinner} />
                Processing...
              </>
            ) : (
              `Pay $${totalPrice}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

// Wrapper component that provides Stripe Elements context
const CheckoutWrapper = ({ product, clientSecret, onBack, stripePromise }) => {
  const options = {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#2563eb",
        colorBackground: "#ffffff",
        colorText: "#1f2937",
        colorDanger: "#ef4444",
        fontFamily: '"Inter", system-ui, sans-serif',
        spacingUnit: "4px",
        borderRadius: "8px",
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm
        product={product}
        clientSecret={clientSecret}
        onBack={onBack}
      />
    </Elements>
  );
};

export default CheckoutWrapper;