package models

import (
	"errors"
	"fmt"
	"os"

	"github.com/bakseter/mandagsmiddag/pkg/config"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func ConfigureDatabase(conf *config.Config) (*gorm.DB, error) {
	database, err := initializeDatabase()
	if err != nil {
		return nil, err
	}

	err = MigrateDatabase(database)
	if err != nil {
		return nil, fmt.Errorf("failed to migrate database: %w", err)
	}

	if conf.Local {
		insertTestUsers(database)
	}

	return database, nil
}

func initializeDatabase() (*gorm.DB, error) {
	databaseHost := os.Getenv("DATABASE_HOST")
	if databaseHost == "" {
		databaseHost = "localhost"
	}

	databaseUsername := os.Getenv("DATABASE_USERNAME")
	if databaseUsername == "" {
		return nil, errors.New("DATABASE_USERNAME is not set")
	}

	databasePassword := os.Getenv("DATABASE_PASSWORD")
	if databasePassword == "" {
		return nil, errors.New("DATABASE_PASSWORD is not set")
	}

	databaseName := os.Getenv("DATABASE_NAME")
	if databaseName == "" {
		return nil, errors.New("DATABASE_NAME is not set")
	}

	dataSourceName := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=5432 sslmode=disable TimeZone=UTC",
		databaseHost,
		databaseUsername,
		databasePassword,
		databaseName,
	)

	database, err := gorm.Open(postgres.Open(dataSourceName), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	return database, nil
}

func MigrateDatabase(database *gorm.DB) error {
	err := database.AutoMigrate(
		&User{},
		&Dinner{},
		&Film{},
		&Penalty{},
		&Rating{},
	)
	if err != nil {
		return err
	}

	return nil
}

func insertTestUsers(database *gorm.DB) {
	testUsers := []User{
		{Email: "mctest@example.com", Name: "Test McTest", IsAdmin: false},
		{Email: "mradmin@example.com", Name: "Mr Admin", IsAdmin: true},
		{Email: "joe@example.com", Name: "Average Joe", IsAdmin: false},
	}

	for _, user := range testUsers {
		_ = database.Create(&user) // ignore errors
	}
}

func WithDatabase(fn func(*gin.Context, *gorm.DB), database *gorm.DB) func(*gin.Context) {
	return func(ctx *gin.Context) {
		fn(ctx, database)
	}
}
