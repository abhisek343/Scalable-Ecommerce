#!/bin/sh
set -e

echo "=== Environment Variables ==="
echo "USER_SERVICE_HOST: ${USER_SERVICE_HOST}"
echo "PRODUCT_SERVICE_HOST: ${PRODUCT_SERVICE_HOST}"
echo "SHOPPING_CART_SERVICE_HOST: ${SHOPPING_CART_SERVICE_HOST}"
echo "ORDER_SERVICE_HOST: ${ORDER_SERVICE_HOST}"
echo "PAYMENT_SERVICE_HOST: ${PAYMENT_SERVICE_HOST}"
echo "NOTIFICATION_SERVICE_HOST: ${NOTIFICATION_SERVICE_HOST}"

# Substitute environment variables in nginx.conf.template and output to nginx.conf
envsubst '${USER_SERVICE_HOST} ${PRODUCT_SERVICE_HOST} ${SHOPPING_CART_SERVICE_HOST} ${ORDER_SERVICE_HOST} ${PAYMENT_SERVICE_HOST} ${NOTIFICATION_SERVICE_HOST}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

echo "=== Generated nginx.conf (first 50 lines) ==="
head -50 /etc/nginx/nginx.conf

echo "=== Testing nginx config ==="
nginx -t

# Execute the CMD from Dockerfile (which is "nginx", "-g", "daemon off;")
exec "$@"
