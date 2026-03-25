//go:build integration

package routes_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/bakseter/mandagsmiddag/pkg/models"
	"github.com/bakseter/mandagsmiddag/pkg/testhelper"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetAllUsers_Empty(t *testing.T) {
	t.Parallel()

	db := testhelper.NewTestDB(t)
	router := testhelper.NewTestRouter(t, db)
	srv := httptest.NewServer(router)
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/user")
	require.NoError(t, err)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var users []models.User
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&users))
	assert.Empty(t, users)
}

func TestGetAllUsers_ReturnsList(t *testing.T) {
	t.Parallel()

	db := testhelper.NewTestDB(t)
	router := testhelper.NewTestRouter(t, db)
	srv := httptest.NewServer(router)
	defer srv.Close()

	testhelper.SeedUser(t, db, "alice@example.com", "Alice", false)
	testhelper.SeedUser(t, db, "bob@example.com", "Bob", false)

	resp, err := http.Get(srv.URL + "/api/user")
	require.NoError(t, err)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var users []map[string]any
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&users))
	assert.Len(t, users, 2)
}

func TestPutUser_NoAuth_Returns401(t *testing.T) {
	t.Parallel()

	db := testhelper.NewTestDB(t)
	router := testhelper.NewTestRouter(t, db)
	srv := httptest.NewServer(router)
	defer srv.Close()

	req, err := http.NewRequest(http.MethodPut, srv.URL+"/api/user", nil)
	require.NoError(t, err)

	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)

	assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
}

func TestPutUser_NewUser_CreatesUser(t *testing.T) {
	t.Parallel()

	db := testhelper.NewTestDB(t)
	router := testhelper.NewTestRouter(t, db)
	srv := httptest.NewServer(router)
	defer srv.Close()

	req, err := http.NewRequest(http.MethodPut, srv.URL+"/api/user", nil)
	require.NoError(t, err)

	for k, v := range testhelper.AuthHeaders("new@example.com", false) {
		req.Header.Set(k, v)
	}

	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var body map[string]any
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&body))
	assert.Equal(t, "new@example.com", body["email"])
	assert.Equal(t, false, body["isAdmin"])

	var user models.User
	require.NoError(t, db.Where("email = ?", "new@example.com").First(&user).Error)
	assert.Equal(t, "new@example.com", user.Email)
}

func TestPutUser_ExistingUser_UpdatesName(t *testing.T) {
	t.Parallel()

	db := testhelper.NewTestDB(t)
	router := testhelper.NewTestRouter(t, db)
	srv := httptest.NewServer(router)
	defer srv.Close()

	testhelper.SeedUser(t, db, "update@example.com", "Old Name", false)

	req, err := http.NewRequest(http.MethodPut, srv.URL+"/api/user", nil)
	require.NoError(t, err)

	headers := testhelper.AuthHeaders("update@example.com", false)
	headers["X-authentik-username"] = "New Name"

	for k, v := range headers {
		req.Header.Set(k, v)
	}

	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var user models.User
	require.NoError(t, db.Where("email = ?", "update@example.com").First(&user).Error)
	assert.Equal(t, "New Name", user.Name)
}

func TestPutUser_AdminGroup_SetsIsAdmin(t *testing.T) {
	t.Parallel()

	db := testhelper.NewTestDB(t)
	router := testhelper.NewTestRouter(t, db)
	srv := httptest.NewServer(router)
	defer srv.Close()

	req, err := http.NewRequest(http.MethodPut, srv.URL+"/api/user", nil)
	require.NoError(t, err)

	for k, v := range testhelper.AuthHeaders("admin@example.com", true) {
		req.Header.Set(k, v)
	}

	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var user models.User
	require.NoError(t, db.Where("email = ?", "admin@example.com").First(&user).Error)
	assert.True(t, user.IsAdmin)
}
