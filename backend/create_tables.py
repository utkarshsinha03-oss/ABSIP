from backend.db import Base, engine
from backend import models

Base.metadata.create_all(bind=engine)

print("Tables created successfully!")