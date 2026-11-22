from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel, Session, create_engine
from app.core.config import settings

# Normalizar URL para PostgreSQL (ej. postgres:// -> postgresql://)
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

is_sqlite = "sqlite" in db_url

if is_sqlite:
    engine = create_engine(
        db_url,
        echo=False,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_engine(
        db_url,
        echo=False,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
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
