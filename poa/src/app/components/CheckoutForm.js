// components/CheckoutForm.jsx
import React, { useState } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement,
  Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  CheckCircle,
  AlertCircle,
  CreditCard,
  Car,
  UserRound,
} from "lucide-react";
import styles from "./checkoutForm.module.css";
import { BeatLoader } from "react-spinners";

// Initialize Stripe outside component
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({total, handleSuccess, customerInfo, setCustomer}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [shipping, setShipping] = useState(false);
  

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
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Send order email to company rep
        setPaymentStatus("success");
        handleSuccess()
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
          Thank you for your purchase!
        </p>
        
      </div>
    );
  }

  return (
    <div>

      <div className={styles.content}>
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
                  onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
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
                  onChange={(e) => setCustomer(prev => ({ ...prev, email: e.target.value }))}
                  className={styles.input}
                  placeholder="Enter your email address"
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Phone Number</label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
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
            {shipping && (
              <>
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
              </>
            )}
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
              `Pay $${total}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

// Wrapper component that provides Stripe Elements context
const CheckoutWrapper = ({ total, clientSecret, handleSuccess, customerInfo, setCustomer}) => {

  // Don't render if clientSecret is missing
  if (!clientSecret) {
    return <div><BeatLoader/></div>;
  }

  

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
        total={total} handleSuccess={handleSuccess} customerInfo={customerInfo} setCustomer={setCustomer}
      />
    </Elements>
  );
};

export default CheckoutWrapper;