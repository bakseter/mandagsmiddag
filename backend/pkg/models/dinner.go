package models

import (
	"time"

	"gorm.io/gorm"
)

type Dinner struct {
    gorm.Model
    HostUserID   uint      `gorm:"not null;index"`
    Host         User      `gorm:"foreignKey:HostUserID"`
    Date         time.Time `gorm:"not null;index"`
    Food         string    `gorm:"type:text"` // Description of food served
    FilmID       *uint     `gorm:"index"` // Nullable in case film isn't selected yet
    Film         *Film     `gorm:"foreignKey:FilmID"`
    
    // Relationships
    Participants []User   `gorm:"many2many:dinner_participants;"`
    Ratings      []Rating `gorm:"foreignKey:DinnerID"`
}
