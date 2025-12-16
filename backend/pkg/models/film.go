package models

import (
	"gorm.io/gorm"
)

type Film struct {
	gorm.Model
	IMDBUrl string
}
