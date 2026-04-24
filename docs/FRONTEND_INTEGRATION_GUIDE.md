# Frontend Integration Guide - Phase 4

## Overview

This guide explains how to integrate the new PostgreSQL backend API with the React frontend, replacing all Supabase calls.

## Quick Start

### 1. Update Environment Variables

Add to `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

### 2. Use the API Client

The new `src/lib/apiClient.ts` provides a simple interface for all API calls:

```typescript
import { apiClient } from '@/lib/apiClient';

// Register
await apiClient.register(email, password, fullName);

// Login
await apiClient.login(email, password);

// Get products
const products = await apiClient.getProducts({ page: 1, limit: 20 });

// Add to cart
await apiClient.addToCart(productId, quantity);
```

## Migration Steps

### Step 1: Replace Authentication

**Before (Supabase):**
```typescript
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase.auth.signUp({
  email,
  password,
});
```

**After (API Client):**
```typescript
import { apiClient } from '@/lib/apiClient';

const response = await apiClient.register(email, password, fullName);
```

### Step 2: Replace Product Fetching

**Before (Supabase):**
```typescript
const { data: products } = await supabase
  .from('products')
  .select('*')
  .limit(50);
```

**After (API Client):**
```typescript
const response = await apiClient.getProducts({ limit: 50 });
const products = response.data;
```

### Step 3: Implement Pagination

**Before (Loading all products):**
```typescript
// ProductContext.tsx - loads 50+ products on startup
const fullProductsResult = await getProducts({ limit: 50 });
```

**After (Paginated loading):**
```typescript
// Load first page only
const response = await apiClient.getProducts({ 
  page: 1, 
  limit: 20 
});

// Load more on demand
const nextPage = await apiClient.getProducts({ 
  page: 2, 
  limit: 20 
});
```

### Step 4: Fix Cart Operations

**Before (Broken):**
```typescript
// Cart operations were throwing "being rebuilt" errors
```

**After (Working):**
```typescript
// Get cart
const cart = await apiClient.getCart();

// Add item
await apiClient.addToCart(productId, quantity);

// Update quantity
await apiClient.updateCartItem(itemId, newQuantity);

// Remove item
await apiClient.removeFromCart(itemId);
```

## Files to Update

### 1. Authentication Context
**File:** `src/contexts/AuthContext.tsx`

Replace Supabase auth calls with API client:
```typescript
// Login
const response = await apiClient.login(email, password);
setUser(response.user);
setToken(response.token);

// Register
const response = await apiClient.register(email, password, fullName);
setUser(response.user);
setToken(response.token);

// Get current user
const response = await apiClient.getCurrentUser();
setUser(response.user);
```

### 2. Product Context
**File:** `src/contexts/ProductContext.tsx`

Implement pagination:
```typescript
// Load first page on mount
const response = await apiClient.getProducts({ 
  page: 1, 
  limit: 20 
});
setProducts(response.data);
setPagination(response.pagination);

// Load more on scroll/button click
const nextResponse = await apiClient.getProducts({ 
  page: currentPage + 1, 
  limit: 20 
});
setProducts([...products, ...nextResponse.data]);
```

### 3. Cart Context
**File:** `src/contexts/CartContext.tsx`

Replace broken CRUD operations:
```typescript
// Get cart
const cart = await apiClient.getCart();
setItems(cart.items);

// Add to cart
await apiClient.addToCart(productId, quantity);

// Update quantity
await apiClient.updateCartItem(itemId, newQuantity);

// Remove from cart
await apiClient.removeFromCart(itemId);
```

### 4. Category Context
**File:** `src/contexts/CategoryContext.tsx`

Replace Supabase calls:
```typescript
const categories = await apiClient.getCategories();
setCategories(categories.data);
```

## API Client Methods

### Authentication
```typescript
apiClient.register(email, password, fullName)
apiClient.login(email, password)
apiClient.logout()
apiClient.getCurrentUser()
apiClient.updateProfile(data)
```

### Products
```typescript
apiClient.getProducts(params)  // params: { page, limit, categoryId, search, featured }
apiClient.getProduct(id)
apiClient.createProduct(data)
apiClient.updateProduct(id, data)
apiClient.deleteProduct(id)
```

### Categories
```typescript
apiClient.getCategories()
apiClient.getCategory(id)
apiClient.createCategory(data)
apiClient.updateCategory(id, data)
apiClient.deleteCategory(id)
```

### Cart
```typescript
apiClient.getCart()
apiClient.addToCart(productId, quantity, variantId)
apiClient.updateCartItem(itemId, quantity)
apiClient.removeFromCart(itemId)
apiClient.clearCart()
```

## Error Handling

The API client throws errors on failed requests. Handle them in your components:

```typescript
try {
  const response = await apiClient.login(email, password);
  setUser(response.user);
} catch (error) {
  setError(error.message);
}
```

## Token Management

The API client automatically:
- Stores token in localStorage
- Includes token in Authorization header
- Restores token on app load

No manual token management needed!

## Pagination Example

```typescript
const [page, setPage] = useState(1);
const [products, setProducts] = useState([]);
const [pagination, setPagination] = useState(null);

useEffect(() => {
  const loadProducts = async () => {
    const response = await apiClient.getProducts({ 
      page, 
      limit: 20 
    });
    setProducts(response.data);
    setPagination(response.pagination);
  };
  loadProducts();
}, [page]);

// In JSX
<button onClick={() => setPage(page + 1)}>
  Next Page
</button>
```

## Search and Filtering

```typescript
// Search products
const response = await apiClient.getProducts({ 
  search: 'perfume',
  limit: 20 
});

// Filter by category
const response = await apiClient.getProducts({ 
  categoryId: 'category-uuid',
  limit: 20 
});

// Show featured only
const response = await apiClient.getProducts({ 
  featured: true,
  limit: 20 
});
```

## Performance Improvements

### Before
- Loaded 50+ products on app startup
- No pagination
- Slow initial load
- High memory usage

### After
- Load 20 products per page
- Lazy load on demand
- Fast initial load
- Low memory usage
- Better user experience

## Testing

### 1. Start Backend
```bash
npm run dev:server
```

### 2. Start Frontend
```bash
npm run dev
```

### 3. Test Login
1. Go to login page
2. Register new account
3. Verify token is stored in localStorage
4. Check browser DevTools > Application > Local Storage

### 4. Test Products
1. Go to products page
2. Verify products load with pagination
3. Check pagination controls work
4. Test search and filtering

### 5. Test Cart
1. Add product to cart
2. Verify cart updates
3. Update quantity
4. Remove item
5. Clear cart

## Troubleshooting

### API Connection Failed
1. Verify backend is running: `npm run dev:server`
2. Check `VITE_API_URL` in `.env`
3. Check browser console for errors
4. Verify CORS is configured

### Token Not Persisting
1. Check localStorage in DevTools
2. Verify `apiClient.setToken()` is called
3. Check token is included in requests

### Products Not Loading
1. Verify database is initialized: `npm run db:init`
2. Check backend logs for errors
3. Verify API endpoint: `curl http://localhost:5000/api/products`

## Next Steps

1. ✅ Create API client
2. ⏳ Update authentication context
3. ⏳ Update product context with pagination
4. ⏳ Fix cart operations
5. ⏳ Update category context
6. ⏳ Test all functionality
7. ⏳ Remove Supabase dependencies

## Support

For issues:
1. Check API documentation: `docs/API_DOCUMENTATION.md`
2. Review API client: `src/lib/apiClient.ts`
3. Check backend logs: `npm run dev:server`
4. Review error messages in browser console

