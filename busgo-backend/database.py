from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from config import get_settings

settings = get_settings()
db_url = settings.database_url if settings.database_url else "sqlite+aiosqlite:///./busgo.db"
if "sqlite" in db_url:
    engine = create_async_engine(db_url, echo=settings.debug)
else:
    engine = create_async_engine(db_url, echo=settings.debug, pool_size=10, max_overflow=20, pool_pre_ping=True)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    async with engine.begin() as conn:
        import models
        await conn.run_sync(Base.metadata.create_all)
