from typing import Optional
from sqlmodel import Session
from app.core.database import session_factory


class UnitOfWork:
    def __init__(self, session_maker=session_factory):
        self.session_maker = session_maker
        self.session: Optional[Session] = None

    def __enter__(self):
        self.session = self.session_maker()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.session is not None:
            try:
                if exc_type is not None:
                    self.session.rollback()
                else:
                    self.session.commit()
            finally:
                self.session.close()
