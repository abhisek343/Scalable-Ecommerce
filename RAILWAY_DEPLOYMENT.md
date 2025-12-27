# 🚀 E-commerce Backend Deployment Guide (Railway)

This guide details how to deploy your microservices e-commerce backend to [Railway](https://railway.app/).

## 1. Prerequisites
- A GitHub account with this repository pushed.
- A Railway account (Login with GitHub).

## 2. Infrastructure Setup (Databases)
Before deploying services, create a **New Project** in Railway and add the following databases:

1.  **MongoDB**: usage for User, Product, Cart, Order, Payment.
2.  **Redis**: usage for User (caching) and Cart.
3.  **RabbitMQ**: usage for Order (messaging).

> [!TIP]
> **Connection Strings**: After creating them, go to the "Variables" tab of each database to find the connection URLs (e.g., `MONGO_URL`, `REDIS_URL`, `RABBITMQ_URL`). You will need these later.

## 3. Deployment Strategy
You will deploy **7 services** from this **same GitHub repository**.

| Service Name | Root Directory | Dockerfile Path | Deployment Notes |
| :--- | :--- | :--- | :--- |
| `user-service` | `/user-service` | `Dockerfile` | Standalone |
| `product-service` | `/product-service` | `Dockerfile` | Standalone |
| `shopping-cart-service` | `/shopping-cart-service` | `Dockerfile` | Standalone |
| `payment-service` | `/payment-service` | `Dockerfile` | Standalone |
| `notification-service` | `/notification-service` | `Dockerfile` | Standalone |
| `order-service` | `/` (Repository Root) | `order-service/Dockerfile` | **Needs Root Context** for shared lib |
| `api-gateway` | `/gateway` | `Dockerfile` | Entrypoint for all traffic |

## 4. Deploying Services
Repeat this process for each service in your Railway Project:

1.  Click **"New"** -> **"GitHub Repo"** -> Select your repo.
2.  **IMMEDIATELY** click the card to open Settings (deployment might fail initially, ignore it).
3.  Go to **"Settings"** -> scroll to **"Root Directory"**.
4.  Set the **Root Directory** and **Dockerfile Path** according to the table above.
    *   *Example for User Service*: Root Directory: `/user-service`
    *   *Example for Order Service*: Root Directory: `/` (Empty), Dockerfile Path: `order-service/Dockerfile`
5.  Go to **"Variables"** and add the required environment variables (see below).

## 5. Environment Variables Checking List

### Common Variables
- `JWT_SECRET`: Generate a strong random string (use the same one for all services).

### User Service
- `PORT`: `5000` (Railway overrides this, but good to set)
- `MONGO_URI`: `mongodb://...` (From Railway MongoDB)
- `REDIS_URL`: `redis://...` (From Railway Redis)

### Product Service
- `PORT`: `5001`
- `MONGO_URI`: `mongodb://...`

### Shopping Cart Service
- `PORT`: `5002`
- `MONGO_URI`: `mongodb://...`
- `PRODUCT_SERVICE_URI`: Internal URL of Product Service (e.g., `http://product-service.railway.internal:PORT`)

### Order Service
- `PORT`: `5003`
- `MONGO_URI`: `mongodb://...`
- `PRODUCT_SERVICE_URI`: `http://product-service.railway.internal:PORT`
- `RABBITMQ_URL`: `amqp://...` (From Railway RabbitMQ)

### Payment Service
- `PORT`: `5004`
- `MONGO_URI`: `mongodb://...`
- `RAZORPAY_KEY_ID`: Your Key
- `RAZORPAY_KEY_SECRET`: Your Secret

### Notification Service
- `PORT`: `5005`
- `NODEMAILER_EMAIL`: Your Email
- `NODEMAILER_PASSWORD`: Your App Password
- `TWILIO_...`: Your Twilio creds

### API Gateway (Nginx)
The most important configuration. You must map the upstream variables to the **Private Networking** addresses of your deployed services.
check the `Settings` -> `Networking` of each service to find its internal host.

- `USER_SERVICE_HOST`: `user-service.railway.internal:5000` (Example)
- `PRODUCT_SERVICE_HOST`: `product-service.railway.internal:5001`
- `SHOPPING_CART_SERVICE_HOST`: `shopping-cart-service.railway.internal:5002`
- `ORDER_SERVICE_HOST`: `order-service.railway.internal:5003`
- `PAYMENT_SERVICE_HOST`: `payment-service.railway.internal:5004`
- `NOTIFICATION_SERVICE_HOST`: `notification-service.railway.internal:5005`

> [!IMPORTANT]
> **Ports matter!** Ensure you include the port if the internal DNS doesn't route automatically. Railway services listen on the `$PORT` assigned to them. If you hardcoded `EXPOSE 5000` etc in Dockerfiles, they might be listening on those specific ports, so use those.

## 6. Accessing the Application
Once the `api-gateway` is deployed:
1.  Go to its **"Settings"** -> **"Networking"**.
2.  Click **"Generate Domain"** to get a public URL (e.g., `web-production.up.railway.app`).
3.  This URL is your entry point!

### How HR/Interviewers Use It (Documentation)
Give them the public URL and tell them to visit:
- **User Service Docs**: `https://<your-url>/api/users/docs/`
- **Product Service Docs**: `https://<your-url>/api/products/docs/`
- **Order Service Docs**: `https://<your-url>/api/orders/docs/`
- ...and so on.

They can use these "Try it out" pages to test sending requests without writing any code!

### API Endpoints
- Users: `https://<your-url>/api/users/...`
- Products: `https://<your-url>/api/products/...`
