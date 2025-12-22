package models

import (
	"gorm.io/gorm"
)

type User struct {
    gorm.Model
    Email       string `gorm:"uniqueIndex;not null"`
    Name        string `gorm:"not null"`
    IsAdmin     bool   `gorm:"default:false"`
    
    // Relationships
    HostedDinners     []Dinner       `gorm:"foreignKey:HostUserID"`
    AttendedDinners   []Dinner       `gorm:"many2many:dinner_participants;"`
    Ratings           []Rating       `gorm:"foreignKey:UserID"`
    PenaltiesReceived []Penalty      `gorm:"foreignKey:UserID"`
    PenaltiesAssigned []Penalty      `gorm:"foreignKey:AssignedByUserID"`
}
