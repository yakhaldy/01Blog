FROM docker:24

WORKDIR /app

COPY . .

RUN apk add --no-cache docker-cli-compose

CMD ["docker","compose","up"]