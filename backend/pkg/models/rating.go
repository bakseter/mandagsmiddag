package models

import (
	"gorm.io/gorm"
)

type Rating struct {
	gorm.Model
	UserID      uint
	DinnerID    uint
	MovieScore  int
	DinnerScore int
}
