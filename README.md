# Real-Time Order Tracking System

A backend system that pushes live database updates to connected
clients the moment something changes, no polling, no refresh.

---

## The Core Idea

Most apps work like this:

> Client asks server "anything new?" every few seconds — this is called **polling**.
> It's wasteful. Imagine checking your mailbox every 5 minutes vs
> getting a doorbell notification.

This system works like a doorbell:

Database changes → Server gets notified → Server tells all clients instantly

## First Approach

My first instinct was event-driven architecture with Kafka:

This is the right approach at scale — it's how high-throughput
systems like Zerodha handle real-time trade updates.

But I quickly realized that PostgreSQL's built-in **LISTEN/NOTIFY** is perfect for this use case. It’s like having a pub/sub system right inside your database, eliminating the need for an external message broker.
Plus Zero extra infrastructure, Postgres itself handles it, and Node.js can listen to those notifications directly.

## Features

- **Live Dashboard:** Instant updates when orders are created or statuses change.
- **Admin Panel:** Control center to manually create orders and transition statuses.
- **Real-Time Notifications:** Bell icon with a red dot notification system for all live events.
- **Database Persistence:** All changes are saved to PostgreSQL and survive page refreshes.
- **Unified Startup:** Run the entire stack with a single command.

## Architecture Overview

**Three notification channels:**

- `order_updates` → when an order status changes or is deleted
- `order_created` → when a new order is placed
- `user_created` → when a new user registers

Each channel maps to a Socket.io event on the client side.

---

## Tech Stack

| Layer    | Choice            | Why                                                         |
| -------- | ----------------- | ----------------------------------------------------------- |
| Backend  | Node.js + Express | Fast, lightweight, great WebSocket support                  |
| Database | PostgreSQL        | Built-in LISTEN/NOTIFY — perfect for real-time              |
| Realtime | Socket.io         | Handles WebSocket connections cleanly                       |
| Client   | React             | cause it is easy to use and has good real-time capabilities |

---

## How The Real-Time Part Works

PostgreSQL has a built-in feature called **LISTEN/NOTIFY**.

Think of it like a pub/sub system built into your database:

- A **trigger** is attached to the orders and users tables
- When any row changes, the trigger calls `pg_notify()`
  which is like ringing a bell on a named channel
- Node.js keeps one dedicated connection open to Postgres
  and listens on those channels
- The moment a notification arrives, Node.js broadcasts
  it to all connected browser clients via WebSocket

## Setup & Installation

### 1. Prerequisites

- Node.js (v18+)
- PostgreSQL (Ensure it is running and accessible) I have added a docker-compose file to make this easier, but you can also set up PostgreSQL manually if you prefer.

### 2. Environment Configuration

Ensure you have a `.env` file in the **root** directory with the following variables:

### 3. Install All Dependencies

Run this from the root directory to install packages for the root, backend, and frontend:

```bash
npm run install:all
```

## How to Run

### Start the Application

To run both the backend and frontend simultaneously:

```bash
npm start
```

- **Frontend:** http://localhost:5173
- **Backend (Socket.IO):** http://localhost:3000

### Reset the Database

If you want to clear all orders and start fresh for a demo:

```bash
npm run db:reset
```

## Project Structure

- `/backend`: Node.js + Socket.IO server with PG listeners.
- `/client`: React + Vite frontend with Vanilla CSS styling.
- `/root`: Configuration and concurrent process management.
