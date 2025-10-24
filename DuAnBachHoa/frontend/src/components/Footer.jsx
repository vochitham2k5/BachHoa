import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => (
  <footer className="py-4 bg-light mt-auto border-top">
    <Container>
      <small className="text-muted">© {new Date().getFullYear()} Bách Hóa - All rights reserved.</small>
    </Container>
  </footer>
);

export default Footer;
