'use client';

import { useState, useEffect } from 'react';
import CheckoutForm from '../components/CheckoutForm';
import styles from "./checkout.module.css"
import { MdExpandMore } from 'react-icons/md';
import { FaArrowRight } from 'react-icons/fa';
import { CheckCircle, } from "lucide-react";
import { LiaExternalLinkAltSolid } from "react-icons/lia";


export default function Checkout() {

  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [savedCart, setSavedCart] = useState({})

  const [cartLoaded, setCartLoaded] = useState(false);

  const [addedItems, setAddedItems] = useState([]);
  const [addedBoxes, setAddedBoxes] = useState([])
  const [addedBoxLike, setAddedBoxLike] = useState([])

  const [boxOpen, setBoxOpen] = useState(null);

  const [total, setTotal] = useState(0)

  const [success, setSuccess] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });




  useEffect(() => {
    getCartFromStorage()
  }, [])


  const getCartFromStorage = () => {
    try {
      const cartData = localStorage.getItem("customerCart");
      if (!cartData) {
        const emptyCart = {
          boxes: [],
          boxLike: [],
          items: {},
        };
        setSavedCart(emptyCart);
        setCartLoaded(true);
        return;
      }

      const parsed = JSON.parse(cartData);
      setSavedCart(parsed);
      console.log(parsed)
      setCartLoaded(true);
    } catch (error) {
      console.warn("Invalid cart data in localStorage, resetting cart:", error);
      localStorage.removeItem("customerCart");
      const emptyCart = { boxes: [], items: {} };
      setSavedCart(emptyCart);
      setCartLoaded(true);
    }
  };


  useEffect(() => {
    if (cartLoaded && (savedCart.boxes?.length > 0 || Object.keys(savedCart.items || {}).length > 0)) {
      getItems()
    }
  }, [savedCart, cartLoaded])


  const getItems = async () => {
    try {
      const response = await fetch('/api/store/checkout', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart: savedCart,
        }),
      });
      const data = await response.json();
      setAddedBoxes(data.data.boxes || []);
      setAddedItems(data.data.added || []);
      setAddedBoxLike(data.data.boxLike || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      setAddedBoxes([]);
      setAddedItems([]);
      setAddedBoxLike([]);
    }
  };

  // Create payment intent 
  // when items are loaded
  useEffect(() => {
    // Only create payment intent if we have items 
    if ((addedItems.length > 0 || addedBoxes.length > 0 || addedBoxLike.length > 0)) {
      createPaymentIntent();
    }
  }, [addedItems, addedBoxes, addedBoxLike]);

  const createPaymentIntent = async () => {
    console.log(addedItems, addedBoxes, addedBoxLike)
    try {
      let amount = 0;
      const productIds = [];

      // Calculate amount from cart items
      if (addedItems.length > 0) {
        for (const item of addedItems) {
          const quantity = savedCart.items[item._id] || 1;
          amount += parseFloat(item.price) * quantity;
          productIds.push(item._id);
        }
      }

      // Calculate amount from boxes
      if (addedBoxes.length > 0) {
        for (const box of addedBoxes) {
          console.log(box.items)
          const boxPrice = box.items.reduce((acc, item) => {
            return acc + (item.price * (item.quantity - item.reserved));
          }, 0);
          amount += boxPrice - (boxPrice * (box.discount || 0) * 0.01);
          box.items.forEach((item) => productIds.push(item._id));
        }
      }

      if(addedBoxLike.length > 0){
        for(const box of addedBoxLike){
          const boxPrice = parseFloat(box.price) * (box.quantity - box.reserved)

          amount += boxPrice - (boxPrice * (box.discount || 0) * 0.01);
        }
      }

      setTotal(amount)

      // Ensure we have a valid amount
      if (amount <= 0) {
        console.error('Invalid amount:', amount);
        setLoading(false);
        return;
      }


      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          productIds,
          metadata: {
            productName:  'General Purchase',
          },
        }),
      });

      console.log(response)

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      console.log("DATA:", data)
      setClientSecret(data.clientSecret);
      setLoading(false);
    } catch (err) {
      console.error('Error creating payment intent:', err);
      setLoading(false);
    }
  };

  const handleSuccess = async () => {
    setSuccess(true)
    // Clear cart from storage
    localStorage.removeItem("customerCart");
    //Add items to reservation
    console.log("CUSTOMER INFO", customerInfo)

    const response = await fetch('/api/store/reserve', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cart: savedCart,
        customer: customerInfo
      }),
    });


    if (response.ok) {
      const data = await response.json();

      const formData = new FormData();
      formData.append('formType', 'product-reservation');
      formData.append('customer', customer.name);
      formData.append('email', customer.email)
      formData.append('reservation', data.data.sequentialId);
      formData.append('orderTitle', "Customer purchase");
      formData.append('soIn', "");
      formData.append('reservationQuantity', addedItems + addedBoxes)
      formData.append('link', `www.pointofaction.com/admin/reservations?id=${data.data._id}`)

      console.log()
      // Send form data to API
      const emailResponse = await fetch('/api/resend', {
        method: 'POST',
        body: formData,
      });

      if (!emailResponse.ok) throw Error

    }

  };

  const handleError = (error) => {
    alert('Payment failed: ' + error.message);
    console.error('Payment error:', error);
  };

  const getBoxDescription = (box) => {
    const descriptors = new Set()
    box.items.forEach((item) => {
      descriptors.add(`${item.brand} ${item.description}s`)
    })
    const descriptorArray = Array.from(descriptors)

    let descriptionString = ""
    descriptorArray.forEach((descriptor, index) => {
      descriptionString += descriptor
      if (index < descriptorArray.length - 2) {
        descriptionString += ", "
      }
      else if (index < descriptorArray.length - 1) {
        descriptionString += " and "
      }
    })

    return descriptionString
  }


  if (success) {
    return (
      <div className={styles.checkout}>
        <div className={styles.successContainer}>
          <CheckCircle className={styles.successIcon} />
          <h2 className={styles.successTitle}>Payment Successful!</h2>
          <p className={styles.successText}>
            Thank you for your purchase!
          </p>
          <a style={{ display: "flex", justifyContent: "center", gap: "5px", alignItems: "center" }}
            href="/store">
            Return to store <LiaExternalLinkAltSolid size={20} />
          </a>
        </div>
      </div>
    );
  }

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
    <div className={styles.checkout}>
      <div className={styles.paymentCard}>
        <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Order Summary</h2>
        <div className={styles.cart} style={{ marginBottom: '20px' }}>
          {
            addedBoxes.map((box, index) =>
              <div>
                <div className={`${styles.row} ${styles.clickable}`} onClick={() => setBoxOpen(boxOpen === index ? null : index)}>
                  <div className={styles.imageContainer}>
                    <img className={styles.image} src={box.image}></img>
                  </div>
                  <div className={styles.description}>{getBoxDescription(box)}</div>
                  <div className={styles.price}>
                    <span style={{ color: "rgb(199, 199, 199)", display: "flex", alignItems: "center", gap: "5px" }}>${(box.modifiedPrice / (1 - parseInt(box.discount) * 0.01)).toFixed(2)} <FaArrowRight /></span>${box.modifiedPrice.toFixed(2)}
                    <div className={`${styles.carat} ${boxOpen === index ? styles.opened : styles.closed}`}>
                      <MdExpandMore size={30} />
                    </div>
                  </div>
                </div>
                <div className={`${styles.subRow} ${boxOpen === index ? styles.subRowOpen : styles.subRowClosed}`}>
                  <div className={styles.subRowItem}>
                    {
                      box.items.map((item, itemIndex) =>
                        <div className={styles.row} style={{ border: "none", borderBottom: "1px solid rgb(232, 232, 232)", borderRadius: "0" }}>
                          <div className={styles.imageContainer}>
                            <img className={styles.image} src={item.image}></img>
                          </div>
                          <div className={styles.description}>{item.size} {item.color} {item.brand} {item.description}</div>
                          <div className={styles.price}><span style={{ color: "rgb(199, 199, 199)" }}>${item.price} x {item.quantity - (item.reserved || 0)} =</span> ${(item.price * (item.quantity - (item.reserved || 0))).toFixed(2)}</div>
                        </div>)
                    }
                  </div>
                </div>
              </div>
            )

          }
          {addedBoxLike.map((item =>
            <div className={styles.row}>
                <div className={styles.imageContainer}>
                  <img className={styles.image} src={item.image}></img>
                </div>
                <div className={styles.description}>{item.size} {item.color} {item.brand} {item.description} Box</div>
                <div className={styles.price}>
                      <span style={{ color: "rgb(199, 199, 199)", display: "flex", alignItems: "center", gap: "5px" }}>${(item.price * (item.quantity - item.reserved)).toFixed(2)} <FaArrowRight /></span>${(item.price * (item.quantity - item.reserved) * (1 - (item.discount * 0.01))).toFixed(2)}
                </div>


              </div>
          ))}
          {

            addedItems.map((item) =>
              <div className={styles.row}>
                <div className={styles.imageContainer}>
                  <img className={styles.image} src={item.image}></img>
                </div>
                <div className={styles.description}>{item.size} {item.color} {item.brand} {item.description}</div>
                <div className={styles.price}><span style={{ color: "rgb(199, 199, 199)" }}>${item.price} x {savedCart.items[item._id]} =</span> ${(item.price * (savedCart.items[item._id])).toFixed(2)}</div>


              </div>)

          }

        </div>
        <div style={{ textAlign: "right" }}>
          <h4>Total: ${total.toFixed(2)}</h4>
        </div>

      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Payment Details</h2>

        <CheckoutForm
          total={total}
          clientSecret={clientSecret}
          handleSuccess={handleSuccess}
          customerInfo={customerInfo}
          setCustomer={setCustomerInfo}
        />

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
  );
}