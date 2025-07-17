# Creators Market

Creators Market is a full-stack web application that serves as a marketplace connecting freelancers with clients. It provides a platform for freelancers to showcase their services and for clients to find and hire talent. The application includes user authentication, a freelancer application and approval system, a service marketplace, a messaging system, and an admin dashboard for platform management.

## Features

-   **User Authentication:** Secure user registration and login for clients and freelancers.
-   **Role-Based Access Control:** Distinct roles for Buyers, Freelancers, and Admins with different permissions.
-   **Freelancer Application System:** A comprehensive application process for users who want to offer services, with an admin-managed review and approval workflow.
-   **Marketplace:** A central hub where freelancers can create, edit, and manage their service posts, and clients can browse, search, and view them.
-   **User Profiles:** Public profiles for freelancers to showcase their skills and services.
-   **Direct Messaging:** A real-time messaging system for seamless communication between users.
-   **Admin Dashboard:** A powerful backend interface for administrators to manage users, review freelancer applications, and oversee the platform.

## Technology Stack

-   **Framework:** [React](https://react.dev/) with [Vite](https://vitejs.dev/)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **Backend & Database:** [Supabase](https://supabase.com/) (Auth, Realtime Database, Storage)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
-   **Routing:** [React Router](https://reactrouter.com/)
-   **State Management:** [@tanstack/react-query](https://tanstack.com/query/latest)
-   **Form Management:** [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for validation
-   **Package Manager:** [pnpm](https://pnpm.io/)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later recommended)
-   [pnpm](https://pnpm.io/installation)

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone <YOUR_GIT_URL>
    cd <PROJECT_DIRECTORY>
    ```

2.  **Install dependencies:**
    ```sh
    pnpm install
    ```

3.  **Set up the database:**
    This project is pre-configured to connect to a specific Supabase instance. To set up the database schema, you need to apply the existing migrations.
    ```sh
    pnpm apply-migrations
    ```
    This command executes the SQL files located in the `supabase/migrations` directory.

4.  **Run the development server:**
    ```sh
    pnpm run dev
    ```
    The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Project Structure

The project follows a standard Vite/React application structure:

```
/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable React components (UI, layout, features)
│   ├── hooks/           # Custom React hooks
│   ├── integrations/    # Supabase client setup
│   ├── lib/             # Utility functions
│   ├── pages/           # Top-level page components for routes
│   ├── App.tsx          # Main app component with routing
│   └── main.tsx         # Application entry point
├── supabase/
│   └── migrations/      # Database migration files
└── package.json         # Project dependencies and scripts
```

## How It Works

### User Roles

-   **Buyer:** The default role for new users. Buyers can browse the marketplace, view freelancer profiles, and initiate conversations.
-   **Freelancer:** Users who have successfully completed and been approved through the freelancer application process. They can create and manage service posts in the marketplace.
-   **Admin:** A user with elevated privileges who can manage the platform, including reviewing applications and managing users.

### Freelancer Application Process

1.  A new user signs up.
2.  To become a freelancer, the user must navigate to the freelancer application page and submit an application.
3.  An Admin reviews the application from the Admin Dashboard.
4.  If the application is approved, the user's role is changed to "Freelancer," and they gain the ability to create posts.

### Creating an Admin User

To create the first admin user for managing the application:

1.  Sign up for a new account through the application's UI.
2.  Locate the script at `src/utils/make-admin.js`.
3.  You will need to provide your Supabase **Service Role Key**. This key can be found in your Supabase project settings under `Project Settings > API > Project API keys`. **Do not confuse this with the public `anon` key.**
4.  Update the `SUPABASE_SERVICE_ROLE_KEY` and `USER_EMAIL` variables in the script.
5.  Run the script from the project root:
    ```sh
    node src/utils/make-admin.js
    ```
6.  Log out and log back into the application. The user will now have admin privileges and access to the Admin Dashboard.

## Available Scripts

-   `pnpm run dev`: Starts the development server with hot-reloading.
-   `pnpm run build`: Bundles the application for production.
-   `pnpm run lint`: Lints the codebase using ESLint.
-   `pnpm run preview`: Serves the production build locally for previewing.
-   `pnpm apply-migrations`: Applies database migrations to the Supabase instance.

## Deployment

This application is a standard Vite project and can be deployed to any hosting service that supports Node.js environments, such as Vercel, Netlify, or AWS Amplify.

When deploying, ensure that the build command is set to `pnpm run build` and the publish directory is `dist`. The environment variables for Supabase (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) should be configured in the hosting provider's settings, even though they are currently hardcoded for the provided development setup.
