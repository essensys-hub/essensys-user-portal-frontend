//go:build ignore

package main

import (
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

func main() {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "changeme_random_secret"
	}
	email := "vwaller@caramail.com"
	if len(os.Args) > 1 {
		email = os.Args[1]
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": email,
		"role": "guest_local",
		"exp":  time.Now().Add(time.Hour).Unix(),
		"iss":  "essensys-backend",
	})
	s, err := t.SignedString([]byte(secret))
	if err != nil {
		panic(err)
	}
	fmt.Print(s)
}
