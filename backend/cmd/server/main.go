package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"tubes2/backend/internal/api/httpapi"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	server := httpapi.New(":" + port)

	go func() {
		if err := server.Run(); err != nil {
			log.Fatalf("listen: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	if err := server.Shutdown(context.Background()); err != nil {
		log.Fatalf("shutdown: %v", err)
	}
}
