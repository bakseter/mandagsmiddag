//go:build integration

package routes_test

import (
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

func TestGetAllRatings_Empty(t *testing.T) {
	t.Parallel()

	db := testhelper.NewTestDB(t)
	router := testhelper.NewTestRouter(t, db)
	srv := httptest.NewServer(router)
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/rating")
	require.NoError(t, err)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var ratings []any
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&ratings))
	assert.Empty(t, ratings)
}

func TestGetRatingByID_NotFound(t *testing.T) {
	t.Parallel()

	db := testhelper.NewTestDB(t)
	router := testhelper.NewTestRouter(t, db)
	srv := httptest.NewServer(router)
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/api/rating/9999")
	require.NoError(t, err)

	assert.Equal(t, http.StatusNotFound, resp.StatusCode)
}

func TestGetRatingsForUser_NoAuth_Returns401(t *testing.T) {
	t.Parallel()

	db := testhelper.NewTestDB(t)
	router := testhelper.NewTestRouter(t, db)
	srv := httptest.NewServer(router)
	defer srv.Close()

	req, err := http.NewRequest(http.MethodGet, srv.URL+"/api/rating/user", nil)
	require.NoError(t, err)

	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)

	assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
}

func TestPutRating_NoAuth_Returns401(t *testing.T) {
	t.Parallel()

	db := testhelper.NewTestDB(t)
	router := testhelper.NewTestRouter(t, db)
	srv := httptest.NewServer(router)
	defer srv.Close()

	resp := putJSON(t, srv.URL+"/api/rating", map[string]any{}, nil)

	assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
}

func TestPutRating_Create(t *testing.T) {
	t.Parallel()

	db := testhelper.NewTestDB(t)
	router := testhelper.NewTestRouter(t, db)
	srv := httptest.NewServer(router)
	defer srv.Close()

	user := testhelper.SeedUser(t, db, "rater@example.com", "Rater", false)
	host := testhelper.SeedUser(t, db, "raterhost@example.com", "Host", true)

	dinner := models.Dinner{
		HostUserID: host.ID,
		Date:       time.Now().UTC(),
		Food:       "Spaghetti",
	}
	require.NoError(t, db.Create(&dinner).Error)

	filmScore := 8
	body := map[string]any{
		"userId":    user.ID,
		"dinnerId":  dinner.ID,
		"filmScore": filmScore,
	}

	resp := putJSON(t, srv.URL+"/api/rating", body, testhelper.AuthHeaders(user.Email, false))

	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	var rating models.Rating
	require.NoError(t, db.Where("user_id = ? AND dinner_id = ?", user.ID, dinner.ID).First(&rating).Error)
	assert.Equal(t, filmScore, rating.FilmScore)
}

func TestPutRating_Upsert_UpdatesExisting(t *testing.T) {
	t.Parallel()

	db := testhelper.NewTestDB(t)
	router := testhelper.NewTestRouter(t, db)
	srv := httptest.NewServer(router)
	defer srv.Close()

	user := testhelper.SeedUser(t, db, "upsertuser@example.com", "Upsert User", false)
	host := testhelper.SeedUser(t, db, "upserthost@example.com", "Host", true)

	dinner := models.Dinner{
		HostUserID: host.ID,
		Date:       time.Now().UTC(),
		Food:       "Risotto",
	}
	require.NoError(t, db.Create(&dinner).Error)

	headers := testhelper.AuthHeaders(user.Email, false)

	// First rating
	body := map[string]any{"userId": user.ID, "dinnerId": dinner.ID, "filmScore": 5}
	resp := putJSON(t, srv.URL+"/api/rating", body, headers)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	// Update same user+dinner → should update, not duplicate
	body = map[string]any{"userId": user.ID, "dinnerId": dinner.ID, "filmScore": 9}
	resp = putJSON(t, srv.URL+"/api/rating", body, headers)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var count int64
	db.Model(&models.Rating{}).Where("user_id = ? AND dinner_id = ?", user.ID, dinner.ID).Count(&count)
	assert.Equal(t, int64(1), count)

	var rating models.Rating
	require.NoError(t, db.Where("user_id = ? AND dinner_id = ?", user.ID, dinner.ID).First(&rating).Error)
	assert.Equal(t, 9, rating.FilmScore)
}

func TestPutRating_NonAdmin_OtherUser_Returns403(t *testing.T) {
	t.Parallel()

	db := testhelper.NewTestDB(t)
	router := testhelper.NewTestRouter(t, db)
	srv := httptest.NewServer(router)
	defer srv.Close()

	rater := testhelper.SeedUser(t, db, "rater2@example.com", "Rater 2", false)
	other := testhelper.SeedUser(t, db, "other@example.com", "Other", false)
	host := testhelper.SeedUser(t, db, "host2@example.com", "Host 2", true)

	dinner := models.Dinner{HostUserID: host.ID, Date: time.Now().UTC(), Food: "Curry"}
	require.NoError(t, db.Create(&dinner).Error)

	body := map[string]any{
		"userId":    other.ID, // trying to rate as someone else
		"dinnerId":  dinner.ID,
		"filmScore": 7,
	}

	resp := putJSON(t, srv.URL+"/api/rating", body, testhelper.AuthHeaders(rater.Email, false))

	assert.Equal(t, http.StatusForbidden, resp.StatusCode)
}

func TestGetRatingsForUser_ReturnsList(t *testing.T) {
	t.Parallel()

	db := testhelper.NewTestDB(t)
	router := testhelper.NewTestRouter(t, db)
	srv := httptest.NewServer(router)
	defer srv.Close()

	user := testhelper.SeedUser(t, db, "listrater@example.com", "List Rater", false)
	host := testhelper.SeedUser(t, db, "listhost@example.com", "List Host", true)

	for i := range 3 {
		dinner := models.Dinner{HostUserID: host.ID, Date: time.Now().UTC().Add(time.Duration(i) * 24 * time.Hour), Food: fmt.Sprintf("Meal %d", i)}
		require.NoError(t, db.Create(&dinner).Error)

		body := map[string]any{"userId": user.ID, "dinnerId": dinner.ID, "filmScore": i + 5}
		resp := putJSON(t, srv.URL+"/api/rating", body, testhelper.AuthHeaders(user.Email, false))
		require.Equal(t, http.StatusCreated, resp.StatusCode)
	}

	req, err := http.NewRequest(http.MethodGet, srv.URL+"/api/rating/user", nil)
	require.NoError(t, err)

	for k, v := range testhelper.AuthHeaders(user.Email, false) {
		req.Header.Set(k, v)
	}

	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var ratings []map[string]any
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&ratings))
	assert.Len(t, ratings, 3)
}
