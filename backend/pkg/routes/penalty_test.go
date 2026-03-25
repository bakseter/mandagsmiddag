//go:build integration

package routes_test

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/bakseter/mandagsmiddag/pkg/testhelper"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetAllPenalties_Empty(t *testing.T) {
	t.Parallel()

	db := testhelper.NewTestDB(t)
	router := testhelper.NewTestRouter(t, db)
	srv := httptest.NewServer(router)
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/penalty")
	require.NoError(t, err)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var penalties []any
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&penalties))
	assert.Empty(t, penalties)
}

func TestPostPenalty_NoAuth_Returns401(t *testing.T) {
	t.Parallel()

	db := testhelper.NewTestDB(t)
	router := testhelper.NewTestRouter(t, db)
	srv := httptest.NewServer(router)
	defer srv.Close()

	resp := postJSON(t, srv.URL+"/api/penalty", map[string]any{}, nil)

	assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
}

func TestPostPenalty_NonAdmin_Returns403(t *testing.T) {
	t.Parallel()

	db := testhelper.NewTestDB(t)
	router := testhelper.NewTestRouter(t, db)
	srv := httptest.NewServer(router)
	defer srv.Close()

	nonAdmin := testhelper.SeedUser(t, db, "nonadmin2@example.com", "Non Admin", false)
	target := testhelper.SeedUser(t, db, "target@example.com", "Target", false)

	body := map[string]any{
		"userId": target.ID,
		"points": 3,
		"reason": "late",
	}

	resp := postJSON(t, srv.URL+"/api/penalty", body, testhelper.AuthHeaders(nonAdmin.Email, false))

	assert.Equal(t, http.StatusForbidden, resp.StatusCode)
}

func TestPostPenalty_Admin_Creates(t *testing.T) {
	t.Parallel()

	db := testhelper.NewTestDB(t)
	router := testhelper.NewTestRouter(t, db)
	srv := httptest.NewServer(router)
	defer srv.Close()

	admin := testhelper.SeedUser(t, db, "penaltyadmin@example.com", "Penalty Admin", true)
	target := testhelper.SeedUser(t, db, "penaltytarget@example.com", "Target", false)

	body := map[string]any{
		"userId": target.ID,
		"points": 5,
		"reason": "forgot to bring dessert",
	}

	resp := postJSON(t, srv.URL+"/api/penalty", body, testhelper.AuthHeaders(admin.Email, true))

	assert.Equal(t, http.StatusCreated, resp.StatusCode)
}

func TestGetPenaltiesForUser_ReturnsList(t *testing.T) {
	t.Parallel()

	db := testhelper.NewTestDB(t)
	router := testhelper.NewTestRouter(t, db)
	srv := httptest.NewServer(router)
	defer srv.Close()

	admin := testhelper.SeedUser(t, db, "listadmin@example.com", "List Admin", true)
	target := testhelper.SeedUser(t, db, "listtarget@example.com", "List Target", false)

	for i := range 2 {
		body := map[string]any{
			"userId": target.ID,
			"points": i + 1,
			"reason": fmt.Sprintf("reason %d", i),
		}
		resp := postJSON(t, srv.URL+"/api/penalty", body, testhelper.AuthHeaders(admin.Email, true))
		require.Equal(t, http.StatusCreated, resp.StatusCode)
	}

	req, err := http.NewRequest(http.MethodGet, fmt.Sprintf("%s/api/penalty/user/%d", srv.URL, target.ID), nil)
	require.NoError(t, err)

	for k, v := range testhelper.AuthHeaders(target.Email, false) {
		req.Header.Set(k, v)
	}

	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var penalties []map[string]any
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&penalties))
	assert.Len(t, penalties, 2)

	// Verify assignedBy field is populated with admin email
	assert.Equal(t, admin.Email, penalties[0]["assignedBy"])
	assert.NotEmpty(t, penalties[0]["reason"])
	assert.NotEmpty(t, penalties[0]["assignedAt"])
}
