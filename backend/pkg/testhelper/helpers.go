//go:build integration

package testhelper

import (
	"crypto/rand"
	"fmt"
	"os"
	"testing"

	"github.com/bakseter/mandagsmiddag/pkg/api"
	"github.com/bakseter/mandagsmiddag/pkg/models"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}

	return fallback
}

// NewTestDB connects to the test Postgres instance, creates an isolated schema,
// runs migrations, and registers cleanup to drop the schema after the test.
func NewTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	host := getenv("TEST_DATABASE_HOST", "localhost")
	user := getenv("TEST_DATABASE_USERNAME", "postgres")
	password := getenv("TEST_DATABASE_PASSWORD", "postgres")
	dbName := getenv("TEST_DATABASE_NAME", "postgres")

	b := make([]byte, 6)
	_, err := rand.Read(b)
	require.NoError(t, err)

	schemaName := fmt.Sprintf("test_%x", b)

	// Connect with the default schema to create the test schema
	adminDSN := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=5432 sslmode=disable TimeZone=UTC",
		host, user, password, dbName,
	)

	adminDB, err := gorm.Open(postgres.Open(adminDSN), &gorm.Config{Logger: logger.Discard})
	require.NoError(t, err, "failed to connect to test database")

	err = adminDB.Exec("CREATE SCHEMA " + schemaName).Error
	require.NoError(t, err, "failed to create test schema")

	// New connection scoped to the test schema
	schemaDSN := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=5432 sslmode=disable TimeZone=UTC search_path=%s",
		host, user, password, dbName, schemaName,
	)

	db, err := gorm.Open(postgres.Open(schemaDSN), &gorm.Config{Logger: logger.Discard})
	require.NoError(t, err, "failed to connect to test schema")

	err = db.AutoMigrate(
		&models.User{},
		&models.Dinner{},
		&models.Film{},
		&models.Penalty{},
		&models.Rating{},
	)
	require.NoError(t, err, "failed to migrate test schema")

	t.Cleanup(func() {
		adminDB.Exec("DROP SCHEMA " + schemaName + " CASCADE")
	})

	return db
}

// NewTestRouter creates a minimal Gin engine wired to the given database.
func NewTestRouter(t *testing.T, db *gorm.DB) *gin.Engine {
	t.Helper()

	gin.SetMode(gin.TestMode)

	router, err := api.NewTestRouter(db)
	require.NoError(t, err)

	return router
}

// SeedUser creates a user directly in the DB and returns it.
func SeedUser(t *testing.T, db *gorm.DB, email, name string, isAdmin bool) models.User {
	t.Helper()

	user := models.User{Email: email, Name: name, IsAdmin: isAdmin}
	err := db.Create(&user).Error
	require.NoError(t, err)

	return user
}

// AuthHeaders returns Authentik-style request headers for the given user.
func AuthHeaders(email string, isAdmin bool) map[string]string {
	groups := ""
	if isAdmin {
		groups = "mandagsmiddag-admin"
	}

	return map[string]string{
		"X-authentik-username": email,
		"X-authentik-email":    email,
		"X-authentik-uid":      "test-uid-" + email,
		"X-authentik-groups":   groups,
	}
}
