// Main Components Barrel Exports

// Common Components
export * from './Common';

// Layout Components  
export * from './Layout';

// Auth Components
export * from './Auth';

// Product Components
export * from './Product';

// Home Components
export * from './Home';

// Trust Components
export * from './Trust';

// Category Components
export { CategoryDisplayCard } from './Category/CategoryDisplayCard';

// Cart Components
export { CartSidebar } from './Cart/CartSidebar';

// Address Components
export { AddressForm } from './Address/AddressForm';
export { AddressManagement } from './Address/AddressManagement';

// Order Components
export { OrderTracking } from './Order/OrderTracking';

// Profile Components
export { SimpleProfilePage } from './Profile/SimpleProfilePage';

// Settings Components
export { AdminSettings } from './Settings/AdminSettings';
export { NotificationSettings } from './Settings/NotificationSettings';
export { PaymentSettings } from './Settings/PaymentSettings';
export { ProfileSettings } from './Settings/ProfileSettings';
export { SecuritySettings } from './Settings/SecuritySettings';
export { SettingsSection } from './Settings/SettingsSection';

// Dashboard Components
export { CustomerDashboard } from './Customer/CustomerDashboard';

// Mobile Components
export { MobileCheckoutLayout as MobileCheckout } from './Mobile/MobileCheckout';
export { MobileShippingForm, MobilePaymentForm, MobileOrderSummary } from './Mobile/MobileCheckoutForms';
export { MobileProductCard } from './Mobile/MobileProductCard';
export { MobileProductCarousel } from './Mobile/MobileProductCarousel';
export { MobileTouchButton, MobileIconButton, MobileFAB } from './Common/Button';

// Performance Components
// LCPOptimizer removed - file does not exist