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