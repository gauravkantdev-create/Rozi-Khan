export const CART_STORAGE_KEY = "rozikhan_cart";
export const CART_CHANGE_EVENT = "rozikhan-cart-change";

export const normalizeCartItem = (item = {}) => ({
  productId: item.productId || item._id || item.id || `${item.name}-${item.price}`,
  name: item.name || "Untitled product",
  price: Number(item.price || 0),
  image: item.image || item.images?.[0] || item.images || "",
  category: item.category || "Dropshipping",
  supplier: item.supplier || "RoziKhan Verified Supplier",
  stock: Number(item.stock || 99),
  quantity: Math.max(Number(item.quantity || 1), 1),
});

export const readCart = () => {
  try {
    const parsedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
    return Array.isArray(parsedCart) ? parsedCart.map(normalizeCartItem) : [];
  } catch {
    return [];
  }
};

export const writeCart = (items) => {
  const normalizedItems = items.map(normalizeCartItem).filter((item) => item.quantity > 0);
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalizedItems));
  window.dispatchEvent(new Event(CART_CHANGE_EVENT));
  return normalizedItems;
};

export const clearCart = () => writeCart([]);

export const getCartCount = (items = readCart()) => {
  return items.reduce((total, item) => total + item.quantity, 0);
};

export const addCartItem = (product, quantity = 1) => {
  const normalizedItem = normalizeCartItem({
    productId: product.productId || product._id,
    name: product.name,
    price: product.price,
    image: product.image || product.images?.[0] || "",
    category: product.category,
    supplier: product.supplier,
    stock: product.stock,
    quantity,
  });

  const cartItems = readCart();
  const existingItem = cartItems.find((item) => item.productId === normalizedItem.productId);
  const stockLimit = Math.max(Number(normalizedItem.stock || 99), 1);

  if (existingItem) {
    return writeCart(
      cartItems.map((item) =>
        item.productId === normalizedItem.productId
          ? { ...item, quantity: Math.min(item.quantity + normalizedItem.quantity, stockLimit) }
          : item
      )
    );
  }

  return writeCart([...cartItems, normalizedItem]);
};

export const updateCartItemQuantity = (productId, quantity) => {
  const cartItems = readCart();

  return writeCart(
    cartItems.map((item) => {
      if (item.productId !== productId) return item;

      const stockLimit = Math.max(Number(item.stock || 99), 1);
      return {
        ...item,
        quantity: Math.min(Math.max(Number(quantity || 1), 1), stockLimit),
      };
    })
  );
};

export const removeCartItem = (productId) => {
  return writeCart(readCart().filter((item) => item.productId !== productId));
};

export const getCartTotals = (items) => {
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const platformFee = subtotal > 0 ? Math.max(Math.round(subtotal * 0.025), 49) : 0;
  const shippingFee = subtotal === 0 || subtotal >= 5000 ? 0 : 249;
  const discount = subtotal >= 10000 ? Math.round(subtotal * 0.05) : 0;
  const grandTotal = Math.max(subtotal + platformFee + shippingFee - discount, 0);

  return {
    subtotal,
    platformFee,
    shippingFee,
    discount,
    grandTotal,
    itemCount,
  };
};
