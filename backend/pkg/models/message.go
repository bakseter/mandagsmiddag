package models

import (
	"gorm.io/gorm"
)

type Message struct {
	gorm.Model

	SenderID uint   `gorm:"not null;index"`
	Sender   User   `gorm:"foreignKey:SenderID"`
	Body     string `gorm:"type:text;not null"`
}
