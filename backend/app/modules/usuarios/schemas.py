from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel


class UserCreate(SQLModel):
    username: str = Field(min_length=1)
    full_name: str = Field(min_length=1)
    email: str = Field(min_length=1)
    password: str = Field(min_length=8)


class UserPublic(SQLModel):
    id: int
    username: str
    full_name: str
    email: str
    role: str
    disabled: bool
    created_at: datetime
