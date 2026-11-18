from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel, Session, create_engine
from app.core.config import settings

connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}

engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args=connect_args,
)

session_factory = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=Session,
)

# Importar todos los modelos para asegurar que el registro de relaciones de SQLAlchemy
# esté completo en cualquier lugar donde se utilice la base de datos o session_factory.
import app.modules.usuarios.models  # noqa: F401, E402
import app.modules.categorias.models  # noqa: F401, E402
import app.modules.productos.models  # noqa: F401, E402
import app.modules.pedidos.models  # noqa: F401, E402


def create_all_tables():
    SQLModel.metadata.create_all(engine)
