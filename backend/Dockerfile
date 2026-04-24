FROM golang:1.26.2 AS build

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY backend ./backend

RUN CGO_ENABLED=0 GOOS=linux go build -o /out/server ./backend/cmd/server

FROM alpine:3.22

WORKDIR /app

COPY --from=build /out/server /app/server

ENV PORT=8080

EXPOSE 8080

CMD ["/app/server"]
