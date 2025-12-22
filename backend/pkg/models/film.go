package models

import (
	"gorm.io/gorm"
)

type Film struct {
    gorm.Model
    Title       string  `gorm:"not null"`
    IMDBUrl     string  `gorm:"uniqueIndex"`
    
    // Relationships
    Dinners []Dinner `gorm:"foreignKey:FilmID"`
}
