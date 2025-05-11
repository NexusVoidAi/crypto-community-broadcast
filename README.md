
# CryptoConnect - Community Announcement Platform

## Project Overview

CryptoConnect is a platform that connects cryptocurrency projects with community managers. It allows projects to create and distribute announcements across multiple crypto communities on platforms like Telegram.

## Features

- **User Authentication**: Secure login and registration with email/password
- **Wallet Integration**: Connect your cryptocurrency wallet via RainbowKit
- **Community Management**: Create, manage, and approve communities
- **Announcement Creation**: Create announcements to be distributed across communities
- **Payment Processing**: Handle payments for announcement distribution
- **Admin Dashboard**: Manage platform settings and moderate content

## Technology Stack

- **Frontend**: React with TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL Database, Authentication, Storage)
- **Web3**: RainbowKit, wagmi, and viem for wallet connections
- **API Integration**: Telegram Bot API integration for community management
- **State Management**: React Context API and TanStack Query
- **UI Components**: shadcn/ui component library

## Getting Started

### Prerequisites

- Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- A Supabase account for backend services
- A wallet for Web3 interactions

### Installation

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

## Project Structure

- `src/components/`: UI components organized by feature
- `src/contexts/`: React Context providers for state management
- `src/pages/`: Main application pages and routes
- `src/hooks/`: Custom React hooks
- `src/integrations/`: External service integrations (Supabase, Web3)
- `src/utils/`: Utility functions and helpers

## Key Features Explained

### Web3 Integration

The platform integrates with cryptocurrency wallets through RainbowKit, allowing users to:
- Connect their wallets to their accounts
- Verify wallet ownership
- Make payments using cryptocurrency

### Community Management

Community owners can:
- Register their Telegram communities
- Set pricing for announcements
- Manage community details and settings
- Receive payments for hosting announcements

### Announcement Distribution

Projects can:
- Create announcements with rich text and media
- Select target communities based on size, focus area, and region
- Pay for announcement distribution
- Track performance and reach

## Deployment Options

### Using Lovable

Simply open [Lovable](https://lovable.dev/projects/dd3ceaec-f6ed-4f11-971d-38c12da72943) and click on Share -> Publish.

### Using a Custom Domain

While Lovable doesn't directly support custom domains yet, you can use services like Netlify to deploy with your own domain. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)

## Contributing

To contribute to this project:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
