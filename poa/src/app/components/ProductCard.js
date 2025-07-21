'use client';

import { useRouter } from 'next/navigation';

export default function ProductCard({ product }) {
  const router = useRouter();

  const handleBuyNow = () => {
    router.push(`/checkout?productId=${product.id}`);
  };

  return (
    <div style={{
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '20px',
      backgroundColor: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <img 
        src={product.image} 
        alt={product.name}
        style={{
          width: '100%',
          height: '200px',
          objectFit: 'cover',
          borderRadius: '4px',
          marginBottom: '16px'
        }}
      />
      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold' }}>
        {product.name}
      </h3>
      <p style={{ 
        margin: '0 0 12px 0', 
        color: '#666', 
        fontSize: '14px',
        lineHeight: '1.4'
      }}>
        {product.description}
      </p>
      <div style={{ marginBottom: '16px' }}>
        {product.features.map((feature, index) => (
          <span 
            key={index}
            style={{
              display: 'inline-block',
              backgroundColor: '#f0f0f0',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              margin: '2px 4px 2px 0',
              color: '#555'
            }}
          >
            {feature}
          </span>
        ))}
      </div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: '16px'
      }}>
        <span style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: '#2563eb' 
        }}>
          ${product.price}
        </span>
        <button 
          onClick={handleBuyNow}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}