# Welcome to Creators Market

## Project info

**URL**: https://lovable.dev/projects/6ed46261-7a05-42da-b4f1-47952cd4e50f

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/6ed46261-7a05-42da-b4f1-47952cd4e50f) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/6ed46261-7a05-42da-b4f1-47952cd4e50f) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Admin Panel and Freelancer Application System

The application includes a robust admin panel and freelancer application system:

### User Roles

- **Buyers**: Can browse the marketplace to find and contact freelancers
- **Freelancers**: Must complete an application to activate their account
- **Admins**: Can manage users, review freelancer applications, and configure the application questions

### Admin Panel Features

- View and manage all users (buyers and freelancers)
- Review and approve/reject freelancer applications
- Configure freelancer application questions
- Suspend/activate user accounts

### Freelancer Application Process

1. User signs up and selects "Freelancer" as account type
2. User is redirected to complete their freelancer application
3. Freelancer answers required questions and submits application
4. Admin reviews application from the admin panel
5. Upon approval, freelancer account is activated and can be used

### Database Schema

The system uses the following database tables:

- `profiles`: Extended with role and account_status
- `freelancer_questions`: Stores configurable application questions
- `freelancer_applications`: Tracks application status and review info
- `freelancer_application_answers`: Stores answers to application questions

### Creating an Admin User

To create your first admin user, follow these steps:

1. Sign up as a regular user through the app
2. Navigate to `src/utils/make-admin.js`
3. Update the following:
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (not the anon key)
   - `USER_EMAIL`: The email of the user you want to make an admin
4. Run the script with Node.js: `node src/utils/make-admin.js`
5. Log out and log back in to refresh your session

Once logged in as an admin, you'll have access to the admin dashboard and admin panel to manage the application.

### Fallback UI Components

If you encounter issues with Radix UI components failing to load (like MIME type errors), the application includes fallback implementations:

- `src/components/ui/simple-radio-group.tsx`: A React-only implementation of the RadioGroup component
- `src/components/ui/simple-dialog.tsx`: A React-only implementation of the Dialog component

To use these components instead of the Radix UI versions:

```tsx
// Instead of
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Use
import { RadioGroup, RadioGroupItem } from '@/components/ui/simple-radio-group';

// And instead of
import { Dialog, DialogContent, ... } from '@/components/ui/dialog';

// Use
import { Dialog, DialogContent, ... } from '@/components/ui/simple-dialog';
```

These fallback components match the API of the Radix UI versions as closely as possible but don't have external dependencies that might cause loading issues.