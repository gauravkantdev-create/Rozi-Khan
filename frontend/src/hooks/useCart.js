import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CART_CHANGE_EVENT,
  addCartItem,
  getCartCount,
  getCartTotals,
  readCart,
  removeCartItem,
  updateCartItemQuantity,
} from "../utils/cart";

function useCart() {
  const [items, setItems] = useState(() => readCart());

  const refreshCart = useCallback(() => {
    setItems(readCart());
  }, []);

  useEffect(() => {
    window.addEventListener(CART_CHANGE_EVENT, refreshCart);
    window.addEventListener("storage", refreshCart);

    return () => {
      window.removeEventListener(CART_CHANGE_EVENT, refreshCart);
      window.removeEventListener("storage", refreshCart);
    };
  }, [refreshCart]);

  const addItem = useCallback((product, quantity = 1) => {
    setItems(addCartItem(product, quantity));
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    setItems(updateCartItemQuantity(productId, quantity));
  }, []);

  const removeItem = useCallback((productId) => {
    setItems(removeCartItem(productId));
  }, []);

  const totals = useMemo(() => getCartTotals(items), [items]);

  return {
    items,
    totals,
    count: getCartCount(items),
    addItem,
    updateQuantity,
    removeItem,
    refreshCart,
  };
}

export default useCart;
