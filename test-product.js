const testProduct = {
  name: "Test Product",
  description: "Test description",
  slug: "test-product-" + Date.now(),
  sku: "TEST-" + Date.now(),
  price: 99.99,
  categoryId: "clx1234567890", // This will need to be a real category ID
  isActive: true,
  isFeatured: false,
  weight: 100,
  dimensions: {
    length: 10,
    width: 5,
    height: 2
  }
};

console.log('Test product data:', JSON.stringify(testProduct, null, 2)); 