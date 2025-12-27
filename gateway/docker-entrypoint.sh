#!/bin/sh
set -e

# Substitute environment variables in nginx.conf.template and output to nginx.conf
envsubst '${USER_SERVICE_HOST} ${PRODUCT_SERVICE_HOST} ${SHOPPING_CART_SERVICE_HOST} ${ORDER_SERVICE_HOST} ${PAYMENT_SERVICE_HOST} ${NOTIFICATION_SERVICE_HOST}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Execute the CMD from Dockerfile (which is "nginx", "-g", "daemon off;")
exec "$@"
