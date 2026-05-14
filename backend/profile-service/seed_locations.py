import csv
import asyncio
from sqlalchemy import delete
from sqlalchemy.future import select
from app.db.session import AsyncSessionLocal
from app.db.models import Region, Locality


async def seed_data():
    try:
        with open("ua-name-places.csv", "r", encoding="utf-8") as file:
            reader = csv.reader(file)
            data = list(reader)
    except FileNotFoundError:
        print("❌ Файл ua_locations.csv не найден!")
        return

    async with AsyncSessionLocal() as session:
        print("🗑 Очистка старой базы...")
        await session.execute(delete(Locality))
        await session.execute(delete(Region))
        await session.commit()

        unique_regions = set()
        for row in data:
            # Индекс 10 — Область
            if len(row) > 10 and row[10].strip():
                unique_regions.add(row[10].strip().title())

        region_map = {}
        print(f"📦 Создание {len(unique_regions)} областей...")
        for r_name in unique_regions:
            region = Region(name=r_name)
            session.add(region)
            await session.flush()
            region_map[r_name.upper()] = region.id

        localities_to_add = []
        added_localities = set()

        type_mapping = {
            "village": "Село",
            "city": "Місто",
            "town": "СМТ",
            "settlement": "Селище"
        }

        print("🏘 Сбор населенных пунктов...")
        for row in data:
            if len(row) < 11:
                continue

            loc_name = row[4].strip()  # Индекс 4 — Украинское название
            loc_type_raw = row[5].strip().lower()  # Индекс 5 — Тип
            r_name = row[10].strip()  # Индекс 10 — Область

            if not r_name or not loc_name:
                continue

            r_id = region_map[r_name.title().upper()]
            loc_key = f"{loc_name.title()}_{r_id}"

            if loc_key not in added_localities:
                loc_type = type_mapping.get(loc_type_raw, loc_type_raw.title())
                localities_to_add.append(Locality(
                    name=loc_name.title(),
                    type=loc_type,
                    region_id=r_id
                ))
                added_localities.add(loc_key)

        print(f"🚀 Сохранение {len(localities_to_add)} записей...")
        # Сохраняем батчами по 5000 записей
        batch_size = 5000
        for i in range(0, len(localities_to_add), batch_size):
            session.add_all(localities_to_add[i:i + batch_size])
            await session.commit()

        print("✅ Успешно загружено!")


if __name__ == "__main__":
    asyncio.run(seed_data())