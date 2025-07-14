# Gemini Project Brief: crimson-okapi-hug

This document provides a high-level overview of the `crimson-okapi-hug` project, its technology stack, and conventions to guide development.

## Project Overview

This appears to be a web application built with React. It includes features for user authentication, a marketplace, a freelancer application system, and an admin dashboard. The project uses Supabase for its backend services. The application seems to be a platform for freelancers and clients to connect.

## How it Works

The application is structured around a few key pages:
- **Index:** The landing page of the application.
- **AuthPage:** Handles user authentication (login/signup).
- **Marketplace:** A page where services or products are listed.
- **Profile:** User profile page.
- **FreelancerApplication:** A form for users to apply to become freelancers.
- **Admin:** An admin dashboard to manage the platform.

The application uses `react-router-dom` to handle navigation between these pages. User authentication is managed via a custom `useAuth` hook, which likely interacts with Supabase for user management. Data fetching and state management are handled by `@tanstack/react-query`.

## Technology Stack

*   **Framework:** [React](https://react.dev/) with [Vite](https://vitejs.dev/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** A collection of custom/sourced components are located in `src/components/ui`. The structure suggests a component library like [shadcn/ui](httpss://ui.shadcn.com/) might be in use.
*   **Backend & Database:** [Supabase](https://supabase.com/)
*   **Package Manager:** pnpm (indicated by `pnpm-lock.yaml`)
*   **Linting:** [ESLint](httpss://eslint.org/)

## Project Structure

*   `src/`: Main application source code.
*   `src/components/`: Reusable React components.
    *   `src/components/auth`: Authentication-related components.
    *   `src/components/ui`: Individual UI elements.
*   `src/hooks/`: Custom React hooks (`useAuth`, `use-mobile`, `use-toast`).
*   `src/integrations/supabase/`: Supabase client and type definitions.
*   `src/pages/`: Top-level page components for each route.
*   `public/`: Static assets.
*   `supabase/`: Supabase configuration and migrations.

## Development Workflow

To run the project locally, you would typically use a command like `pnpm run dev`.

To install dependencies, use `pnpm install`.

Linting can be run with `pnpm run lint` (assuming this script is defined in `package.json`).