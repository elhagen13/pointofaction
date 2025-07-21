export const products = [
    {
      id: 1,
      name: "Wireless Headphones",
      price: 129.99,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop",
      description: "Premium wireless headphones with noise cancellation and 30-hour battery life.",
      features: ["Noise Cancellation", "30-hour Battery", "Wireless", "Premium Audio"]
    },
    {
      id: 2,
      name: "Smart Watch",
      price: 299.99,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop",
      description: "Advanced fitness tracking, heart rate monitor, and smartphone connectivity.",
      features: ["Fitness Tracking", "Heart Rate Monitor", "Water Resistant", "7-day Battery"]
    },
    {
      id: 3,
      name: "Laptop Stand",
      price: 49.99,
      image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300&h=300&fit=crop",
      description: "Ergonomic aluminum laptop stand with adjustable height and angle.",
      features: ["Adjustable Height", "Aluminum Build", "Ergonomic", "Portable"]
    },
    {
      id: 4,
      name: "Mechanical Keyboard",
      price: 159.99,
      image: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=300&h=300&fit=crop",
      description: "RGB backlit mechanical keyboard with premium switches and wireless connectivity.",
      features: ["Mechanical Switches", "RGB Lighting", "Wireless", "Programmable Keys"]
    },
    {
      id: 5,
      name: "Portable Speaker",
      price: 79.99,
      image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop",
      description: "Waterproof Bluetooth speaker with 360-degree sound and 12-hour battery.",
      features: ["Waterproof", "360° Sound", "12-hour Battery", "Bluetooth 5.0"]
    },
    {
      id: 6,
      name: "Wireless Mouse",
      price: 39.99,
      image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300&h=300&fit=crop",
      description: "Precision wireless mouse with ergonomic design and long battery life.",
      features: ["Wireless", "Ergonomic", "Precision Tracking", "Long Battery"]
    }
  ];
  
  export const getProductById = (id) => {
    return products.find(product => product.id === parseInt(id));
  };