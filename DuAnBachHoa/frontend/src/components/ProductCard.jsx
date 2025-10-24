import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const ProductCard = ({ product, onAdd }) => (
  <Card className="h-100 shadow-sm">
    {product.images?.[0] && (
      <Link to={`/buyer/products/${product.id}`}>
        <Card.Img variant="top" src={product.images[0]} alt={product.name} style={{ objectFit: 'cover', height: 180 }} />
      </Link>
    )}
    <Card.Body className="d-flex flex-column">
      <Card.Title className="fs-6 text-truncate" title={product.name}>
        <Link to={`/buyer/products/${product.id}`} className="text-decoration-none">{product.name}</Link>
      </Card.Title>
      <div className="mt-auto">
        <div className="fw-bold text-danger">{(product.sale_price ?? product.price).toLocaleString()} ₫</div>
        {product.sale_price && (
          <small className="text-muted text-decoration-line-through">{product.price.toLocaleString()} ₫</small>
        )}
        <Button variant="primary" className="w-100 mt-2" onClick={() => onAdd?.(product)}>Thêm vào giỏ</Button>
      </div>
    </Card.Body>
  </Card>
);

export default ProductCard;
