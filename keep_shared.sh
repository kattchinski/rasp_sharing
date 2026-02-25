#!/bin/bash
while true; do
    # Примусово піднімаємо з'єднання в режимі shared
    sudo nmcli connection modify "ShareWiFi" ipv4.method shared && echo "We start to share!"
    sleep 60
done
