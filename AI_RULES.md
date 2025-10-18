# AI Development Rules

This document outlines the technology stack and provides clear guidelines for making changes to this web application. Following these rules ensures consistency, maintainability, and adherence to best practices.

## Technology Stack

This project is built with a modern, robust, and efficient tech stack:

-   **Framework:** React with Vite for a fast development experience and optimized builds.
-   **Language:** TypeScript for type safety and improved code quality.
-   **Styling:** Tailwind CSS for a utility-first styling approach.
-   **UI Components:** shadcn/ui, which provides accessible and customizable components built on top of Radix UI and Tailwind CSS.
-   **Routing:** React Router (`react-router-dom`) for all client-side navigation.
-   **Backend & Database:** Supabase for backend services, including authentication, database, and serverless functions.
-   **Data Fetching:** TanStack Query (React Query) for managing server state, caching, and data synchronization.
-   **Icons:** Lucide React for a comprehensive and consistent set of icons.
-   **Forms:** React Hook Form with Zod for powerful and type-safe form handling and validation.

## Library Usage Rules

To maintain consistency, please adhere to the following rules when adding or modifying features:

-   **UI Components:**
    -   **ALWAYS** use a component from the `shadcn/ui` library if one exists for the required purpose (e.g., `Button`, `Card`, `Input`).
    -   If a `shadcn/ui` component needs minor modifications, extend it using Tailwind CSS classes.
    -   For completely new components, build them from scratch using React, TypeScript, and Tailwind CSS. Place them in the `src/components/` directory.

-   **Styling:**
    -   **ONLY** use Tailwind CSS utility classes for styling.
    -   Avoid writing custom CSS in `.css` files. The existing `index.css` is for global styles and Tailwind directives only.
    -   Use the `cn` utility function from `src/lib/utils.ts` to conditionally apply classes.

-   **State Management:**
    -   For server state (data fetched from an API or Supabase), **ALWAYS** use TanStack Query (`useQuery`, `useMutation`).
    -   For simple, local component state, use React's built-in hooks like `useState` and `useReducer`.
    -   Avoid introducing global state management libraries like Redux or Zustand unless the application's complexity absolutely requires it.

-   **Routing:**
    -   All routes should be defined in `src/App.tsx` using `react-router-dom`.
    -   Create new page components in the `src/pages/` directory.

-   **Icons:**
    -   **ONLY** use icons from the `lucide-react` library.

-   **Backend Operations:**
    -   All interactions with the backend (database queries, server-side logic) **MUST** go through the Supabase client (`src/integrations/supabase/client.ts`).
    -   Server-side logic should be implemented as Supabase Edge Functions in the `supabase/functions/` directory.

-   **Notifications:**
    -   Use the `useToast` hook (`src/hooks/use-toast.ts`) for displaying toast notifications to the user for feedback on their actions.

By following these guidelines, we can ensure the codebase remains clean, consistent, and easy to work with.