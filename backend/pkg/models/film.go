package models

import (
	"net/url"
	"strings"

	log "github.com/sirupsen/logrus"
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
	// We therefore add a scheme if it's missing, so parsing will be correct.
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

	// TODO: Don't use IMDB URL as a catch-all for other activities.
	if !strings.Contains(parsedURL.Host, "imdb.com") {
		log.Warnf("Host of URL does not contain 'imdb.com', host is '%s'", parsedURL.Host)

		urlWithoutTrailingSlash := strings.TrimSuffix(parsedURL.String(), "/")

		return urlWithoutTrailingSlash, nil
	}

	pathWithoutTrailingSlash := strings.TrimSuffix(parsedURL.Path, "/")
	normalizedIMDBUrl := "https://www.imdb.com" + pathWithoutTrailingSlash

	return normalizedIMDBUrl, nil
}
