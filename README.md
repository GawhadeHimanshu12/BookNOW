# BookNOW - Movie & Event Ticketing Platform

BookNOW is a full-stack MERN application inspired by platforms like BookMyShow, designed to provide a seamless experience for Browse movies and events, selecting seats, and booking tickets. It features distinct dashboards for users, event organizers, and administrators.

## ✨ Key Features

* **User Authentication:** Secure registration, login, and JWT-based session management. Includes password reset via email.
* **Role-Based Access Control:**
    * **Users:** Browse content, book tickets, view booking history, write reviews.
    * **Organizers:** Manage their venues, create and manage showtimes (with tiered pricing), view bookings for their events/movies, manage their profile. Organizer accounts require admin approval.
    * **Admins:** Full oversight including user management (approve organizers), content management (movies, events, venues), city and promo code management, view all bookings, and platform statistics.
* **Content Discovery:**
    * Homepage displaying "Now Showing" movies and "Upcoming Events".
    * Detailed pages for movies and events.
    * Global search functionality for movies, events, and venues.
* **Booking System:**
    * Interactive seat map for seat selection.
    * **Tiered Pricing:** Organizers can set different prices for different seat types (e.g., Normal, VIP, Premium) for each showtime.
    * Promo code application.
    * Booking confirmation with a unique QR code for tickets.
* **Review System:** Users can submit ratings and comments for movies they've booked.
* **Admin & Organizer Dashboards:** Comprehensive UIs for managing platform aspects and organizer-specific content.
* **Email Notifications:** For password resets and booking confirmations.

## 🛠️ Tech Stack

* **Frontend:**
    * React (with Vite)
    * React Router DOM (v6) for client-side routing
    * Material-UI (MUI) for UI components and styling
    * Axios for API communication
    * Day.js for date/time manipulation
    * `qrcode.react` for QR code generation
    * Context API for global state management (e.g., Authentication)
* **Backend:**
    * Node.js
    * Express.js for the RESTful API framework
    * MongoDB (with Mongoose ODM) as the database
    * JWT (JSON Web Tokens) for authentication
    * `bcryptjs` for password hashing
    * `express-validator` for input validation
    * `nodemailer` for sending emails
    * `nanoid` for generating unique booking reference IDs
    * MongoDB Transactions for atomic operations (requires replica set, e.g., MongoDB Atlas)
* **Development Tools:**
    * Nodemon for automatic server restarts
    * ESLint for code linting

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

* Node.js (v18.x or later recommended)
* npm (v9.x or later) or yarn
* MongoDB (Ensure you have a MongoDB instance running. For full transaction support as implemented in the controllers, this instance **must be configured as a replica set**. MongoDB Atlas free tier provides this by default.)

### Installation & Setup

1.  **Clone the Repository:**
    ```bash
    git clone <your-repository-url> BookNOW
    cd BookNOW
    ```

2.  **Backend Setup:**
    * Navigate to the server directory:
        ```bash
        cd server
        ```
    * Install dependencies:
        ```bash
        npm install
        # or
        # yarn install
        ```
    * Create a `.env` file in the `server` directory by copying `server/.env.example` (if you create one) or by using the structure provided during codebase generation. Populate it with your:
        * MongoDB Atlas connection string (`MONGODB_URI`) - **ensure it points to a replica set for transactions.**
        * JWT Secret (`JWT_SECRET`)
        * Email service credentials (e.g., Mailtrap or SendGrid for `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM_ADDRESS`)
        * `FRONTEND_URL` (e.g., `http://localhost:5173`)
        * Default admin credentials for seeding (`DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`, `DEFAULT_ADMIN_NAME`)
    * The port for the backend is typically set in the `.env` file (`PORT=5001`).

3.  **Frontend Setup:**
    * Navigate to the client directory:
        ```bash
        cd ../client 
        # (from the server directory, or directly to BookNOW/client from project root)
        ```
    * Install dependencies:
        ```bash
        npm install
        # or
        # yarn install
        ```
    * The client primarily uses Vite's proxy to connect to the backend, so direct API URLs in a client-side `.env` are usually not needed. The `vite.config.js` handles proxying `/api` requests.

### Running the Application

1.  **Start the Backend Server:**
    * In the `server` directory:
        ```bash
        npm run dev
        ```
    * This will typically start the server on `http://localhost:5001` (or the port specified in your `.env`).

2.  **Start the Frontend Development Server:**
    * In a new terminal, navigate to the `client` directory:
        ```bash
        npm run dev
        ```
    * This will typically start the frontend on `http://localhost:5173`. Open this URL in your browser.

### Seeding Data

The project includes scripts to seed initial data:

1.  **Seed Default Admin User:**
    * Ensure your backend server is running or at least that your `.env` file in the `server` directory has the `MONGODB_URI` and `DEFAULT_ADMIN_...` variables set.
    * In the `server` directory, run:
        ```bash
        npm run seed:admin
        ```
    * This will create a default admin user if one doesn't already exist with the specified email.

2.  **Seed Sample Data (Movies, Venues, etc.):**
    * In the `server` directory, run:
        ```bash
        npm run seed:data
        ```
    * To destroy all sample data (excluding users managed by `seed:admin`):
        ```bash
        npm run seed:data:destroy
        ```

## ⚙️ Environment Variables

Ensure you have a `.env` file in the `server` directory with the following variables (refer to the `.env` example provided during code generation for details):

* `PORT`
* `MONGODB_URI` (Crucial: For transactions, this must point to a MongoDB replica set, e.g., Atlas free tier or higher)
* `JWT_SECRET`
* `JWT_EXPIRES_IN`
* `NODE_ENV`
* `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM_ADDRESS`, `EMAIL_SECURE`
* `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`, `DEFAULT_ADMIN_NAME`
* `FRONTEND_URL`

## 📜 Available Scripts

In the `server` directory:
* `npm start`: Starts the server in production mode (uses `node server.js`).
* `npm run dev`: Starts the server in development mode with `nodemon` for auto-restarts.
* `npm run seed:admin`: Creates or updates the default admin user.
* `npm run seed:data`: Populates the database with sample movies, venues, etc.
* `npm run seed:data:destroy`: Removes the sample data populated by `seed:data`.

In the `client` directory:
* `npm run dev`: Starts the Vite development server for the frontend.
* `npm run build`: Builds the frontend for production (output to `client/dist`).
* `npm run lint`: Lints the frontend code.
* `npm run preview`: Serves the production build locally for preview.

## 📂 Project Structure Overview
