# BookNOW

**Live Project URL:** [https://13.126.248.37.nip.io](https://13.126.248.37.nip.io)

## Overview
BookNOW is a comprehensive, full-stack MERN (MongoDB, Express, React, Node.js) application designed for the seamless ticketing and booking of movies and events. The platform serves as a multi-vendor ecosystem, allowing regular users to book tickets, venue organizers to manage their theaters and events, and administrators to oversee the entire platform. 

The application features secure authentication, dynamic seat mapping, real-time availability checking, automated data seeding, and role-based access control. It is deployed in a production environment on AWS EC2.

## System Architecture

The application follows a modern, decoupled client-server architecture deployed on Amazon Web Services (AWS).

* **Client Tier (Frontend):** A Single Page Application (SPA) built with React.js and packaged using Vite. It utilizes React Router for client-side navigation and React Context API for global state management (such as user authentication sessions).
* **Web Server / Reverse Proxy Tier:** Nginx is configured on the AWS EC2 instance to serve the compiled static React files and act as a reverse proxy. It securely routes incoming API traffic to the underlying Node.js application.
* **Application Tier (Backend):** A RESTful API built with Node.js and Express.js. The server runs continuously in the background using the PM2 process manager to ensure high availability and automatic restarts.
* **Data Tier:** MongoDB (via MongoDB Atlas) serves as the primary NoSQL database, structured with Mongoose Object Data Modeling (ODM) to enforce schema validation and relationships between entities.

## External Integrations
* **Razorpay Payment Gateway:** Securely processes online transactions for ticket bookings, utilizing webhooks to update booking statuses in real-time.
* **AWS SES (Simple Email Service):** Handles secure email dispatch for One-Time Passwords (OTPs), user verification, and booking confirmation tickets.
* **Google OAuth 2.0:** Integrated via Passport.js for seamless third-party authentication.
* **TMDB API:** Utilized by backend seeding scripts to populate the database with real-world, up-to-date movie data.

## Core Features

### User Module
* **Authentication & Security:** Secure login and registration with hashed passwords. Supports Google OAuth 2.0 and AWS SES-powered OTP email verification for password resets and account validation.
* **Discovery & Search:** Global search and filtering capabilities to find movies, events, and venues based on city and availability.
* **Dynamic Booking Engine:** Interactive visual seat map allowing users to select specific seats. The system prevents double-booking through real-time database validation and processes payments via Razorpay.
* **User Dashboard:** A dedicated portal for users to view past and upcoming bookings, download digital tickets (QR codes), and manage their profile.
* **Review System:** Verified users can leave ratings and text reviews for movies and events they have attended.

### Organizer Module
* **Venue Management:** Organizers can register physical locations (theaters, event grounds), defining screen capacity and standard seating layouts.
* **Showtime Scheduling:** Interface to link movies or events to specific venues, setting dates, times, and dynamic ticket pricing.
* **Sales Tracking:** Dedicated dashboard to view ticket sales, revenue statistics, and active bookings for their specific venues.
* **Ticket Scanning:** Built-in endpoints to support QR code scanning at the venue doors to mark digital tickets as verified and used.

### Admin Module
* **Platform Moderation:** Super-admin privileges to approve or reject new organizer accounts and ban or unban users.
* **Content Management:** Full CRUD (Create, Read, Update, Delete) access over movies, events, venues, and user reviews to moderate inappropriate content.
* **Marketing & Promotions:** Ability to generate and manage global Promo Codes (percentage-based or flat discounts) with expiration dates and usage limits.
* **Global Analytics:** High-level platform statistics tracking total users, total revenue, and overall booking volume.

## Technology Stack

**Frontend**
* React.js (Vite)
* Context API (State Management)
* Axios (HTTP Client)
* Tailwind CSS / Material UI (UI Component Libraries)

**Backend**
* Node.js & Express.js
* Mongoose (MongoDB ODM)
* Passport.js (Google OAuth Strategy)
* Razorpay Node SDK
* JSON Web Tokens (JWT) & Express-Session
* Helmet & CORS (Security Middleware)

**Infrastructure & Deployment**
* AWS EC2 (Ubuntu Linux)
* AWS SES (Email Service)
* Nginx (Web Server)
* PM2 (Process Manager)
* MongoDB Atlas (Cloud Database)