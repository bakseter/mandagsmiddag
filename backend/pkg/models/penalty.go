package models

import (
	"time"

	"gorm.io/gorm"
)

type Penalty struct {
    gorm.Model
    UserID           uint      `gorm:"not null;index"`
    User             User      `gorm:"foreignKey:UserID"`
    AssignedByUserID uint      `gorm:"not null;index"`
    AssignedBy       User      `gorm:"foreignKey:AssignedByUserID"`
    Points           int       `gorm:"not null;"`
    Reason           string    `gorm:"type:text;not null"`
    AssignedAt       time.Time `gorm:"not null;index"`
}