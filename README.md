# 🚀 Plug-and-Play WhatsApp Communication Engine

<p align="center">

![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)
![Express](https://img.shields.io/badge/Express.js-Backend-black?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?logo=mongodb)
![Redis](https://img.shields.io/badge/Redis-Queue-red?logo=redis)
![Bull](https://img.shields.io/badge/Bull-Job%20Queue-orange)
![WhatsApp](https://img.shields.io/badge/WhatsApp-Web.js-25D366?logo=whatsapp)
![Puppeteer](https://img.shields.io/badge/Puppeteer-Chromium-blue?logo=googlechrome)

</p>

---

# 📖 Overview

The **Plug-and-Play WhatsApp Communication Engine** is a backend communication platform that enables applications to send WhatsApp messages using a user's existing WhatsApp account without relying on the official WhatsApp Business Cloud API.

Instead of requiring API approval, business verification, or paid messaging plans, the engine authenticates a user's WhatsApp account by scanning a QR code through **WhatsApp Web**. Once authenticated, the engine exposes REST APIs that allow external applications to send messages, monitor delivery status, manage user sessions, and automate communication workflows.

The engine follows a modular architecture and integrates **Node.js**, **Express**, **MongoDB**, **Redis**, **Bull Queue**, **Puppeteer**, and **whatsapp-web.js** to provide a scalable and extensible messaging solution.

---

# ❗ Problem Statement

Modern organizations increasingly rely on WhatsApp for customer communication, appointment reminders, notifications, marketing campaigns, and operational messaging.

However, the official WhatsApp Business API presents several challenges:

- Business verification is mandatory.
- Meta approval is required.
- Messaging costs increase with usage.
- Setup is time-consuming.
- API access is not suitable for rapid prototyping.
- Small businesses and developers often cannot justify the onboarding effort.
- Developers cannot quickly integrate WhatsApp messaging into internal tools or personal automation systems.

As a result, developers require a lightweight communication engine that can be deployed quickly without depending on external API approvals.

---

# 💡 Proposed Solution

The Plug-and-Play WhatsApp Communication Engine addresses these limitations by providing a self-hosted backend service that connects directly to a user's WhatsApp account using **WhatsApp Web**.

The solution works as follows:

1. User starts the server.
2. Engine generates a QR Code.
3. User scans the QR using the WhatsApp mobile application.
4. Session is securely stored locally.
5. External applications communicate with the engine through REST APIs.
6. Messages are placed into a Redis-backed Bull Queue.
7. Worker processes deliver messages through WhatsApp Web.
8. Delivery information is stored inside MongoDB.
9. Existing sessions are restored automatically whenever the server restarts.

This architecture removes the need for Meta Business verification while providing a flexible communication platform suitable for development, research, automation, and internal enterprise systems.

---

# 🎯 Objectives

The primary objectives of this project are:

- Build a plug-and-play WhatsApp communication engine.
- Eliminate dependency on the official WhatsApp Business API.
- Enable QR-based authentication.
- Maintain persistent login sessions.
- Provide REST APIs for message transmission.
- Queue outgoing messages for reliable delivery.
- Store communication logs.
- Support modular integration with third-party applications.
- Enable future scalability through worker-based architecture.

---

# ✨ Features

## Authentication

- QR Code based WhatsApp login
- Session persistence
- Automatic session restoration
- Logout support
- Multi-session architecture support

---

## Messaging

- Send text messages
- Queue-based message processing
- Reliable asynchronous delivery
- Delivery status tracking
- Failure handling

---

## Queue Management

- Redis-backed Bull Queue
- Background workers
- Retry mechanism
- Scalable processing

---

## Session Management

- Persistent LocalAuth storage
- Automatic reconnection
- Session monitoring
- Authentication state tracking

---

## Database

MongoDB stores

- User Sessions
- Message Logs
- Delivery Status
- Timestamps
- Metadata

---

## REST APIs

The engine exposes APIs for

- Login
- QR Generation
- Send Message
- Logout
- Session Status
- Health Monitoring

---

# 🏗 System Architecture

```text
                   +----------------------+
                   |   Client Application |
                   +----------+-----------+
                              |
                        REST API Request
                              |
                              ▼
                 +---------------------------+
                 |      Express Server        |
                 +-------------+-------------+
                               |
        +----------------------+--------------------+
        |                                           |
        ▼                                           ▼
Session Manager                               API Routes
        |                                           |
        ▼                                           ▼
 WhatsApp Client -------------------------> Bull Queue
        |                                           |
        ▼                                           ▼
 WhatsApp Web                                Queue Worker
        |                                           |
        +----------------------+--------------------+
                               |
                               ▼
                         Send Message
                               |
                               ▼
                         WhatsApp User

                MongoDB <------ Logs ------> Redis
```

---

# ⚙ Technology Stack

| Layer | Technology |
|--------|------------|
| Runtime | Node.js |
| Backend Framework | Express.js |
| WhatsApp Integration | whatsapp-web.js |
| Browser Automation | Puppeteer |
| Database | MongoDB |
| Queue | Bull |
| Queue Storage | Redis |
| Authentication | QR Code + LocalAuth |
| API Style | REST |
| Language | JavaScript |

---

# 📌 Why This Project?

Unlike many WhatsApp automation projects that simply send messages, this project focuses on building a reusable communication engine.

The engine separates responsibilities into different modules, including session management, API routing, queue processing, authentication, and data persistence. This modular architecture allows other applications to integrate with the engine without directly interacting with WhatsApp Web.

The design also enables future enhancements such as scheduled messaging, media support, chatbot integration, analytics, role-based authentication, and distributed worker deployment.

---

# 📂 High-Level Workflow

1. Start the Express server.
2. Initialize WhatsApp client.
3. Generate QR code if no valid session exists.
4. Authenticate the user.
5. Restore session on subsequent startups.
6. Receive API request.
7. Validate request.
8. Push message into Bull Queue.
9. Queue worker processes message.
10. Message sent through WhatsApp Web.
11. Store message information in MongoDB.
12. Return API response.

---

# 📂 Project Structure

The project follows a modular architecture where each module is responsible for a specific functionality, making the application scalable and easy to maintain.

```text
whatsapp-engine/
│
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   │
│   ├── lib/
│   │   ├── queue.js              # Bull queue configuration
│   │   └── sessionManager.js     # WhatsApp client & session management
│   │
│   ├── middleware/
│   │   └── loginAuth.js          # Authentication middleware
│   │
│   ├── models/
│   │   ├── Message.js            # Message schema
│   │   └── UserSession.js        # User session schema
│   │
│   ├── public/
│   │   └── login.html            # QR Login Page
│   │
│   ├── routes/
│   │   └── api.js                # REST API endpoints
│   │
│   ├── messageQueue.js           # Queue worker
│   └── server.js                 # Application entry point
│
├── .env.example
├── package.json
├── package-lock.json
└── README.md
```

---

# 🏛 Project Architecture

The application is divided into independent modules.

| Module | Responsibility |
|---------|----------------|
| Express Server | Receives API requests |
| API Routes | Exposes REST endpoints |
| Session Manager | Initializes WhatsApp client and restores sessions |
| Bull Queue | Queues outgoing messages |
| Queue Worker | Processes queued messages |
| MongoDB Models | Stores messages and session data |
| Redis | Queue storage |
| Puppeteer | Controls Chromium for WhatsApp Web |
| LocalAuth | Persists authenticated sessions |

---

# ⚙ Prerequisites

Before running the project, ensure the following software is installed.

| Software | Version |
|----------|---------|
| Node.js | 18+ (Recommended: 20+) |
| npm | Latest |
| MongoDB | Running locally or remotely |
| Redis | Running locally or remotely |
| Google Chrome | Installed (or Chromium) |

---

# 📦 Installation

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/<your-username>/whatsapp-engine.git
```

```bash
cd whatsapp-engine
```

---

## 2️⃣ Install Dependencies

```bash
npm install
```

This installs all required packages listed in `package.json`.

Major dependencies include:

- express
- whatsapp-web.js
- puppeteer
- mongoose
- bull
- redis
- qrcode
- dotenv
- cors

---

## 3️⃣ Configure Environment Variables

Create a `.env` file in the project root.

Example:

```env
PORT=3000

MONGO_URI=mongodb://localhost:27017/whatsapp-engine

REDIS_HOST=127.0.0.1

REDIS_PORT=6379

SESSION_ID=main-session
```

> **Note:** Your actual `.env.example` should be kept synchronized with the variables your code uses.

---

# 🍃 MongoDB Configuration

The project uses MongoDB to persist application data.

Stored information includes:

- WhatsApp session metadata
- Message history
- Delivery status
- Queue processing logs
- Timestamps

Start MongoDB before running the application.

Example:

```bash
mongod
```

Verify the database connection before starting the server.

---

# 🔴 Redis Configuration

Redis is used as the backend for Bull Queue.

It stores queued jobs before they are processed by the worker.

Start Redis.

Linux/macOS

```bash
redis-server
```

Windows

Start Redis using your installed Redis service or Docker container.

Verify Redis is running.

```bash
redis-cli ping
```

Expected output:

```text
PONG
```

---

# ▶ Running the Application

Start the server.

```bash
npm start
```

or

```bash
node src/server.js
```

If using nodemon during development:

```bash
npm run dev
```

---

# 🚀 Application Startup

When the server starts, it performs the following steps automatically:

1. Loads environment variables.
2. Connects to MongoDB.
3. Connects to Redis.
4. Initializes Bull Queue.
5. Creates Express server.
6. Initializes WhatsApp client.
7. Restores previous session if available.
8. Generates QR Code when authentication is required.
9. Starts listening for API requests.

---

# 📱 First-Time Authentication

When running the application for the first time:

1. Start the server.
2. Open the login page in your browser.
3. A QR Code will be displayed.
4. Open WhatsApp on your mobile device.
5. Navigate to **Linked Devices**.
6. Scan the QR Code.
7. Wait for successful authentication.
8. The authenticated session is securely stored for future use.

After successful login, the engine restores the saved session automatically on subsequent restarts, eliminating the need to scan the QR Code again unless the user explicitly logs out or the session becomes invalid.

---

# 🔐 Session Persistence

The engine uses **LocalAuth** provided by `whatsapp-web.js`.

This enables:

- Persistent login sessions
- Automatic session restoration
- Reduced authentication overhead
- Seamless reconnection after server restarts

A new QR Code is generated only when:

- No saved session exists.
- The user logs out.
- The saved session becomes invalid or expires.

---

# 🌐 Default Server

Once the server starts successfully, it listens on:

```text
http://localhost:3000
```

The REST APIs are accessible through this server.

Example:

```text
POST http://localhost:3000/api/send
```

---

# 📄 Logging

The application logs important events, including:

- Database connection
- Redis connection
- WhatsApp client initialization
- QR Code generation
- Authentication success
- Message queue events
- Message delivery
- Errors and exceptions

These logs help monitor system health and simplify debugging.

---

# 📡 REST API Documentation

The engine exposes RESTful APIs that allow external applications to interact with WhatsApp through a simple HTTP interface.

---

## Base URL

```text
http://localhost:3000
```

---

# Authentication APIs

## Generate QR Code

Initializes the WhatsApp client and generates a QR code if no valid session exists.

**Endpoint**

```http
GET /login
```

**Description**

- Starts WhatsApp authentication
- Displays QR Code
- Waits for user authentication
- Stores authenticated session locally

---

## Session Status

Returns the current authentication status.

**Endpoint**

```http
GET /api/status
```

### Success Response

```json
{
    "authenticated": true,
    "status": "ready"
}
```

---

## Logout

Destroys the active WhatsApp session.

**Endpoint**

```http
POST /api/logout
```

### Success Response

```json
{
    "success": true,
    "message": "Logged out successfully."
}
```

---

# Messaging APIs

## Send Message

Queues a WhatsApp message for asynchronous delivery.

**Endpoint**

```http
POST /api/send
```

### Request Body

```json
{
    "phone": "919876543210",
    "message": "Hello from WhatsApp Communication Engine!"
}
```

### Success Response

```json
{
    "success": true,
    "message": "Message queued successfully."
}
```

### Error Response

```json
{
    "success": false,
    "message": "WhatsApp client is not authenticated."
}
```

---

# 🔄 Complete Request Flow

The following workflow describes how a message travels through the system.

```text
Client Application
        │
        ▼
POST /api/send
        │
        ▼
Express Router
        │
        ▼
Request Validation
        │
        ▼
Bull Queue
        │
        ▼
Redis
        │
        ▼
Queue Worker
        │
        ▼
WhatsApp Client
        │
        ▼
WhatsApp Web
        │
        ▼
Recipient
        │
        ▼
MongoDB
```

---

# 🔐 Authentication Workflow

Authentication is handled using **whatsapp-web.js** with **LocalAuth**.

### First Login

```text
Start Server
      │
      ▼
Initialize WhatsApp Client
      │
      ▼
Saved Session Exists?
      │
 ┌────┴────┐
 │         │
No        Yes
 │         │
 ▼         ▼
Generate QR Restore Session
 │         │
 ▼         ▼
User Scans QR
 │
 ▼
Authentication Success
 │
 ▼
Session Saved
```

---

# 📬 Message Processing Workflow

Message delivery is asynchronous.

```text
REST API
   │
   ▼
Validate Input
   │
   ▼
Create Queue Job
   │
   ▼
Redis Queue
   │
   ▼
Worker Picks Job
   │
   ▼
WhatsApp Client
   │
   ▼
Message Delivered
   │
   ▼
Save Result to MongoDB
```

---

# 🧠 Session Management

The session manager is responsible for:

- Initializing the WhatsApp client
- Restoring saved sessions
- Generating QR codes
- Monitoring authentication state
- Handling reconnections
- Destroying sessions during logout

The engine stores authentication data locally using **LocalAuth**, eliminating the need for repeated QR scans after every restart.

---

# 📥 Queue Management

The application uses **Bull Queue** with **Redis**.

### Responsibilities

- Queue outgoing messages
- Prevent request blocking
- Process messages asynchronously
- Improve scalability
- Retry failed jobs (if configured)
- Separate API handling from message delivery

Queue-based processing ensures that API responses remain fast while message delivery continues in the background.

---

# 🗄 Database Models

## UserSession

Stores information related to authenticated WhatsApp sessions.

Typical fields include:

- Session ID
- Authentication status
- Creation timestamp
- Last active timestamp

---

## Message

Stores metadata for every processed message.

Typical fields include:

- Recipient number
- Message content
- Delivery status
- Queue information
- Timestamp

These collections provide a historical record of communication and simplify auditing and debugging.

---

# ⚠ Error Handling

The engine includes centralized error handling for common failure scenarios.

Examples include:

- Invalid request payload
- Missing required fields
- WhatsApp client not authenticated
- MongoDB connection failure
- Redis connection failure
- Queue processing errors
- Session initialization failure
- Internal server errors

Each error returns an appropriate HTTP status code and descriptive response message to assist client applications.

---

# 📈 Scalability

The architecture has been designed with scalability in mind.

Current implementation supports:

- Background message processing
- Persistent sessions
- Modular architecture
- Queue-based communication

Future improvements can include:

- Multiple WhatsApp accounts
- Horizontal worker scaling
- Distributed Redis deployment
- Load balancing
- Authentication tokens
- Rate limiting
- Message scheduling
- Media message support

---