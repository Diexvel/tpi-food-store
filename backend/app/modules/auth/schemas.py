from sqlmodel import SQLModel
from app.modules.usuarios.schemas import UserCreate, UserPublic


class MessageResponse(SQLModel):
    message: str
