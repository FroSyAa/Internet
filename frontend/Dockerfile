FROM nginx:alpine

COPY *.html /usr/share/nginx/html/

COPY public/css /usr/share/nginx/html/css/
COPY public/images /usr/share/nginx/html/images/
COPY js /usr/share/nginx/html/js/

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
