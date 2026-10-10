from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import Role, User


def main():
    full_name = input("Full name: ").strip()
    email = input("Email: ").strip().lower()
    password = input("Password (min 8 chars): ")

    with SessionLocal() as db:
        if db.scalar(select(User).where(User.email == email)):
            print("A user with this email already exists.")
            return
        db.add(
            User(
                full_name=full_name,
                email=email,
                password_hash=hash_password(password),
                role=Role.admin.value,
            )
        )
        db.commit()
    print("Admin created.")


if __name__ == "__main__":
    main()