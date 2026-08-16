# Admin Application Directory Map

This directory (`src/apps/admin`) contains the administrative panel for the multi-tenant storefront application.

## Directory Structure

*   **`components/Admin/`**: Contains the core administrative UI components, organized by feature area.
    *   **`Categories/`**: Management of product categories.
    *   **`Dashboard/`**: Overview and analytics metrics for the storefront.
    *   **`Layout/`**: Admin shell, navigation sidebar, and top header.
    *   **`Orders/`**: Order processing, status updates, and history.
    *   **`Products/`**: Product inventory management, creation, and editing.
    *   **`Settings/`**: Store configuration (contact info, social media, policies).
    *   **`Users/`**: Customer and admin user management.
*   **`pages/`**: (If present) Route components for the admin app.
*   **`hooks/`**: Custom hooks specific to the admin panel logic.

## Refactoring Guidelines (WIP)

To ensure high performance, reliability, and ease of maintenance in a multi-tenant environment, this directory is undergoing a refactoring process to adhere to modern best practices:

1.  **Form Management**: Replace manual state-based forms (`useState` + custom validation) with `react-hook-form` and `zod` for robust validation and less boilerplate.
2.  **Data Fetching**: Use `@tanstack/react-query` exclusively for all data fetching and mutations, avoiding custom `useEffect` loading flows.
3.  **API Client**: Always use `apiClient` (`src/shared/lib/apiClient.ts`) for network requests instead of direct Supabase client calls.
4.  **Component Simplification**: Break down monolithic components (e.g., massive list/form combinations) into smaller, reusable UI pieces.
5.  **Multi-Tenancy**: Ensure no cross-tenant data leakage by strictly relying on backend RLS (Row Level Security) and contextual tenant IDs where necessary (though the current design assumes one admin per storefront).

*(Note: This README will be updated continuously as the refactoring progresses.)*
