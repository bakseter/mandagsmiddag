//go:build integration

package routes_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/bakseter/mandagsmiddag/pkg/models"
	"github.com/bakseter/mandagsmiddag/pkg/testhelper"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func postJSON(t *testing.T, url string, body any, headers map[string]string) *http.Response {
	t.Helper()

	b, err := json.Marshal(body)
	require.NoError(t, err)

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(b))
	require.NoError(t, err)
	req.Header.Set("Content-Type", "application/json")

	for k, v := range headers {
		req.Header.Set(k, v)
	}

	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)

	return resp
}

func putJSON(t *testing.T, url string, body any, headers map[string]string) *http.Response {
	t.Helper()

	b, err := json.Marshal(body)
	require.NoError(t, err)

	req, err := http.NewRequest(http.MethodPut, url, bytes.NewReader(b))
	require.NoError(t, err)
	req.Header.Set("Content-Type", "application/json")

	for k, v := range headers {
		req.Header.Set(k, v)
	}

	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)

	return resp
}

func TestGetAllDinners_Empty(t *testing.T) {
	t.Parallel()

	db := testhelper.NewTestDB(t)
	router := testhelper.NewTestRouter(t, db)
	srv := httptest.NewServer(router)
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/dinner")
	require.NoError(t, err)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var dinners []any
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&dinners))
	assert.Empty(t, dinners)
}

func TestGetDinnerByID_NotFound(t *testing.T) {
	t.Parallel()

	db := testhelper.NewTestDB(t)
	router := testhelper.NewTestRouter(t, db)
	srv := httptest.NewServer(router)
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/dinner/9999")
	require.NoError(t, err)

	assert.Equal(t, http.StatusNotFound, resp.StatusCode)
}

func TestPutDinner_NoAuth_Returns401(t *testing.T) {
	t.Parallel()

	db := testhelper.NewTestDB(t)
	router := testhelper.NewTestRouter(t, db)
	srv := httptest.NewServer(router)
	defer srv.Close()

	resp := putJSON(t, srv.URL+"/api/dinner", map[string]any{}, nil)

	assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
}

func TestPutDinner_Create(t *testing.T) {
	t.Parallel()

	db := testhelper.NewTestDB(t)
	router := testhelper.NewTestRouter(t, db)
	srv := httptest.NewServer(router)
	defer srv.Close()

	admin := testhelper.SeedUser(t, db, "host@example.com", "Host", true)

	// First sync user via PUT /api/user so IsAdmin is set in DB
	req, _ := http.NewRequest(http.MethodPut, srv.URL+"/api/user", nil)
	for k, v := range testhelper.AuthHeaders(admin.Email, true) {
		req.Header.Set(k, v)
	}
	_, err := http.DefaultClient.Do(req)
	require.NoError(t, err)

	body := map[string]any{
		"hostUserId": admin.ID,
		"date":       time.Now().UTC().Format(time.RFC3339),
		"food":       "Lasagne",
	}

	resp := putJSON(t, srv.URL+"/api/dinner", body, testhelper.AuthHeaders(admin.Email, true))

	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	var dinner models.Dinner
	require.NoError(t, db.Where("food = ?", "Lasagne").First(&dinner).Error)
	assert.Equal(t, admin.ID, dinner.HostUserID)
}

func TestPutDinner_WithFilm_CreatesFilmRecord(t *testing.T) {
	t.Parallel()

	db := testhelper.NewTestDB(t)
	router := testhelper.NewTestRouter(t, db)
	srv := httptest.NewServer(router)
	defer srv.Close()

	admin := testhelper.SeedUser(t, db, "filmhost@example.com", "Film Host", true)

	body := map[string]any{
		"hostUserId":  admin.ID,
		"date":        time.Now().UTC().Format(time.RFC3339),
		"food":        "Pizza",
		"filmImdbUrl": "https://www.imdb.com/title/tt0111161/",
		"filmTitle":   "The Shawshank Redemption",
	}

	resp := putJSON(t, srv.URL+"/api/dinner", body, testhelper.AuthHeaders(admin.Email, true))

	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	var film models.Film
	require.NoError(t, db.Where("imdb_url = ?", "https://www.imdb.com/title/tt0111161/").First(&film).Error)
	assert.Equal(t, "The Shawshank Redemption", film.Title)
}

func TestPutDinner_DuplicateFilmIMDB_ReusesFilm(t *testing.T) {
	t.Parallel()

	db := testhelper.NewTestDB(t)
	router := testhelper.NewTestRouter(t, db)
	srv := httptest.NewServer(router)
	defer srv.Close()

	admin := testhelper.SeedUser(t, db, "dedup@example.com", "Dedup", true)
	imdbURL := "https://www.imdb.com/title/tt0068646/"

	for i := range 2 {
		body := map[string]any{
			"hostUserId":  admin.ID,
			"date":        time.Now().UTC().Add(time.Duration(i) * 24 * time.Hour).Format(time.RFC3339),
			"food":        fmt.Sprintf("Dinner %d", i),
			"filmImdbUrl": imdbURL,
			"filmTitle":   "The Godfather",
		}
		resp := putJSON(t, srv.URL+"/api/dinner", body, testhelper.AuthHeaders(admin.Email, true))
		assert.Equal(t, http.StatusCreated, resp.StatusCode)
	}

	var count int64
	db.Model(&models.Film{}).Where("imdb_url = ?", imdbURL).Count(&count)
	assert.Equal(t, int64(1), count)
}

func TestPutDinner_NonAdmin_OtherHost_Returns403(t *testing.T) {
	t.Parallel()

	db := testhelper.NewTestDB(t)
	router := testhelper.NewTestRouter(t, db)
	srv := httptest.NewServer(router)
	defer srv.Close()

	host := testhelper.SeedUser(t, db, "realhost@example.com", "Real Host", false)
	nonAdmin := testhelper.SeedUser(t, db, "nonadmin@example.com", "Non Admin", false)

	// Sync nonadmin user so they exist in DB with IsAdmin=false
	req, _ := http.NewRequest(http.MethodPut, srv.URL+"/api/user", nil)
	for k, v := range testhelper.AuthHeaders(nonAdmin.Email, false) {
		req.Header.Set(k, v)
	}
	_, err := http.DefaultClient.Do(req)
	require.NoError(t, err)

	body := map[string]any{
		"hostUserId": host.ID,
		"date":       time.Now().UTC().Format(time.RFC3339),
		"food":       "Taco",
	}

	resp := putJSON(t, srv.URL+"/api/dinner", body, testhelper.AuthHeaders(nonAdmin.Email, false))

	assert.Equal(t, http.StatusForbidden, resp.StatusCode)
}

func TestDeleteDinner_Returns204(t *testing.T) {
	t.Parallel()

	db := testhelper.NewTestDB(t)
	router := testhelper.NewTestRouter(t, db)
	srv := httptest.NewServer(router)
	defer srv.Close()

	admin := testhelper.SeedUser(t, db, "delhost@example.com", "Del Host", true)

	body := map[string]any{
		"hostUserId": admin.ID,
		"date":       time.Now().UTC().Format(time.RFC3339),
		"food":       "To Delete",
	}

	putResp := putJSON(t, srv.URL+"/api/dinner", body, testhelper.AuthHeaders(admin.Email, true))
	require.Equal(t, http.StatusCreated, putResp.StatusCode)

	var dinner models.Dinner
	require.NoError(t, db.Where("food = ?", "To Delete").First(&dinner).Error)

	req, _ := http.NewRequest(http.MethodDelete, fmt.Sprintf("%s/api/dinner/%d", srv.URL, dinner.ID), nil)
	delResp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)

	assert.Equal(t, http.StatusNoContent, delResp.StatusCode)
}

func TestGetAllDinners_SortedByDateDesc(t *testing.T) {
	t.Parallel()

	db := testhelper.NewTestDB(t)
	router := testhelper.NewTestRouter(t, db)
	srv := httptest.NewServer(router)
	defer srv.Close()

	admin := testhelper.SeedUser(t, db, "sorter@example.com", "Sorter", true)

	dates := []time.Time{
		time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
		time.Date(2024, 6, 15, 0, 0, 0, 0, time.UTC),
		time.Date(2024, 3, 10, 0, 0, 0, 0, time.UTC),
	}

	for i, d := range dates {
		body := map[string]any{
			"hostUserId": admin.ID,
			"date":       d.Format(time.RFC3339),
			"food":       fmt.Sprintf("Food %d", i),
		}
		resp := putJSON(t, srv.URL+"/api/dinner", body, testhelper.AuthHeaders(admin.Email, true))
		require.Equal(t, http.StatusCreated, resp.StatusCode)
	}

	resp, err := http.Get(srv.URL + "/api/dinner")
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var dinners []map[string]any
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&dinners))
	require.Len(t, dinners, 3)

	// Verify sorted newest first — parse RFC3339 to compare times regardless of timezone offset
	t1, err1 := time.Parse(time.RFC3339, dinners[0]["date"].(string))
	t2, err2 := time.Parse(time.RFC3339, dinners[1]["date"].(string))
	t3, err3 := time.Parse(time.RFC3339, dinners[2]["date"].(string))
	require.NoError(t, err1)
	require.NoError(t, err2)
	require.NoError(t, err3)
	assert.True(t, t1.After(t2), "first dinner should be newest")
	assert.True(t, t2.After(t3), "second dinner should be newer than third")
}
