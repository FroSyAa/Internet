FROM nginx:alpine

COPY index.html /usr/share/nginx/html/
COPY category.html /usr/share/nginx/html/
COPY cart.html /usr/share/nginx/html/
COPY orders.html /usr/share/nginx/html/
COPY login.html /usr/share/nginx/html/
COPY register.html /usr/share/nginx/html/
COPY test-api.html /usr/share/nginx/html/
COPY admin.html /usr/share/nginx/html/

COPY public /usr/share/nginx/html/

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
