package models

import (
	"gorm.io/gorm"
)

type Rating struct {
    gorm.Model   
    FilmScore   int `gorm:"not null;check:film_score >= 1 AND film_score <= 10"`   // 1-10 scale
    DinnerScore int `gorm:"not null;check:dinner_score >= 1 AND dinner_score <= 10"` // 1-10 scale

		UserID      uint `gorm:"not null;index;uniqueIndex:idx_user_dinner"` // Composite unique index
    User        User `gorm:"foreignKey:UserID"`
    DinnerID    uint `gorm:"not null;index;uniqueIndex:idx_user_dinner"` // Prevents duplicate ratings
    Dinner      Dinner `gorm:"foreignKey:DinnerID"`
}
