import React, { useEffect, useState } from 'react';
import { Accordion, Form } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';

const useQuerySync = () => {
  const [params, setParams] = useSearchParams();
  const set = (key, val) => {
    if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
      params.delete(key);
    } else {
      params.set(key, Array.isArray(val) ? val.join(',') : String(val));
    }
    setParams(params, { replace: true });
  };
  const get = (key) => params.get(key);
  return { get, set };
};

const FilterPanel = () => {
  const { get, set } = useQuerySync();
  const [category, setCategory] = useState(get('category') || '');
  const [inStock, setInStock] = useState(get('inStock') === '1');
  const [minPrice, setMinPrice] = useState(get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(get('maxPrice') || '');

  useEffect(() => { set('category', category || undefined); }, [category, set]);
  useEffect(() => { set('inStock', inStock ? '1' : undefined); }, [inStock, set]);
  useEffect(() => { set('minPrice', minPrice || undefined); }, [minPrice, set]);
  useEffect(() => { set('maxPrice', maxPrice || undefined); }, [maxPrice, set]);

  return (
    <Accordion defaultActiveKey="0">
      <Accordion.Item eventKey="0">
        <Accordion.Header>Danh mục</Accordion.Header>
        <Accordion.Body>
          <Form.Select value={category} onChange={e => setCategory(e.target.value)} aria-label="Chọn danh mục">
            <option value="">Tất cả</option>
            <option value="fruits">Trái cây</option>
            <option value="drinks">Đồ uống</option>
            <option value="snacks">Bánh kẹo</option>
          </Form.Select>
        </Accordion.Body>
      </Accordion.Item>
      <Accordion.Item eventKey="1">
        <Accordion.Header>Kho hàng</Accordion.Header>
        <Accordion.Body>
          <Form.Check type="checkbox" id="inStock" label="Còn hàng" checked={inStock} onChange={e => setInStock(e.target.checked)} />
        </Accordion.Body>
      </Accordion.Item>
      <Accordion.Item eventKey="2">
        <Accordion.Header>Giá</Accordion.Header>
        <Accordion.Body>
          <div className="d-flex gap-2">
            <Form.Control type="number" placeholder="Tối thiểu" value={minPrice} onChange={e => setMinPrice(e.target.value)} aria-label="Giá tối thiểu" />
            <Form.Control type="number" placeholder="Tối đa" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} aria-label="Giá tối đa" />
          </div>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
};

export default FilterPanel;
