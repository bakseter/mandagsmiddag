package models

import (
	"errors"
	"net/url"
	"strings"

	"gorm.io/gorm"
)

type Film struct {
	gorm.Model

	Title   string `gorm:"not null"`
	IMDBUrl string `gorm:"uniqueIndex"`

	// Relationships
	Dinners []Dinner `gorm:"foreignKey:FilmID"`
}

func NormalizeIMDBUrl(imdbURL string) (string, error) {
	if imdbURL == "" {
		return "", nil
	}

	// If scheme is missing, parsed URL will have empty Scheme and Host, and Path will be entire URL.
	// We therefore add a scheme if it's missing, so parsing will be more accurate.
	imdbURLWithScheme := func() string {
		if strings.HasPrefix(imdbURL, "http://") || strings.HasPrefix(imdbURL, "https://") {
			return imdbURL
		}

		return "https://" + imdbURL
	}()

	parsedURL, err := url.Parse(imdbURLWithScheme)
	if err != nil {
		return "", err
	}

	if !strings.Contains(parsedURL.Host, "imdb.com") {
		return "", errors.New("host of URL does not contain 'imdb.com', host is '" + parsedURL.Host + "'")
	}

	pathWithoutTrailingSlash := strings.TrimSuffix(parsedURL.Path, "/")
	normalizedIMDBUrl := "https://www.imdb.com" + pathWithoutTrailingSlash

	return normalizedIMDBUrl, nil
}
