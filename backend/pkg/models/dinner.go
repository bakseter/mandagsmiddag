package models

import (
	"gorm.io/gorm"
)

type Dinner struct {
	gorm.Model
	HostUserID   uint
	Date         string
	Participants []User `gorm:"many2many:dinner_participants;"`
	FilmID	   uint
}
