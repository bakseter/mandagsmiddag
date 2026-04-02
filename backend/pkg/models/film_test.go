package models_test

import (
	"testing"

	"github.com/bakseter/mandagsmiddag/pkg/models"
)

func TestNormalizeIMDBUrl(t *testing.T) { //nolint:funlen
	t.Parallel()

	tests := []struct {
		name    string
		input   string
		want    string
		wantErr bool
	}{
		{
			name:    "empty string",
			input:   "",
			want:    "",
			wantErr: false,
		},
		{
			name:    "valid URL with https, mobile subdomain, and query parameters",
			input:   "https://m.imdb.com/title/tt27367464/?ref_=nv_sr_srsg_0_tt_4_nm_4_in_0_q_kneecap",
			want:    "https://www.imdb.com/title/tt27367464",
			wantErr: false,
		},
		{
			name:    "valid URL with http",
			input:   "http://www.imdb.com/title/tt0117407",
			want:    "https://www.imdb.com/title/tt0117407",
			wantErr: false,
		},
		{
			name:    "valid URL without scheme",
			input:   "www.imdb.com/title/tt0117407",
			want:    "https://www.imdb.com/title/tt0117407",
			wantErr: false,
		},
		{
			name:    "valid URL with mobile subdomain and without scheme",
			input:   "m.imdb.com/title/tt0117407",
			want:    "https://www.imdb.com/title/tt0117407",
			wantErr: false,
		},
		{
			name:    "invalid URL with non-imdb host",
			input:   "https://www.example.com/title/tt0117407",
			want:    "",
			wantErr: true,
		},
		{
			name:    "invalid URL with non-imdb host and without scheme",
			input:   "www.example.com/title/tt0117407",
			want:    "",
			wantErr: true,
		},
		{
			name:    "invalid URL with non-imdb host and mobile subdomain",
			input:   "m.example.com/title/tt0117407",
			want:    "",
			wantErr: true,
		},
	}

	for _, testCase := range tests {
		t.Run(testCase.name, func(t *testing.T) {
			t.Parallel()

			got, err := models.NormalizeIMDBUrl(testCase.input)
			if (err != nil) != testCase.wantErr {
				t.Errorf("NormalizeIMDBUrl() error = %v, wantErr %v", err, testCase.wantErr)

				return
			}

			if got != testCase.want {
				t.Errorf("NormalizeIMDBUrl() = %v, want %v", got, testCase.want)
			}
		})
	}
}
