import json
import asyncio
from sqlalchemy.future import select

# Импортируйте вашу сессию БД (проверьте правильность пути, если он отличается)
from app.db.session import AsyncSessionLocal
from app.db.models import Region, Locality


async def seed_data():
    print("⏳ Читаем JSON файл...")
    try:
        # Убедитесь, что ваш JSON файл называется именно так и лежит рядом со скриптом
        with open("ua_locations.json", "r", encoding="utf-8") as file:
            data = json.load(file)
    except FileNotFoundError:
        print("❌ Файл ua_locations.json не найден в корне проекта!")
        return

    async with AsyncSessionLocal() as session:
        print("🔍 Собираем уникальные области...")

        # 1. Собираем все уникальные регионы из JSON (игнорируем пустые)
        unique_regions = set()
        for item in data:
            if item.get("region"):
                unique_regions.add(item["region"])

        # Словарь для связи: "НАЗВАНИЕ В JSON" -> ID в базе данных
        region_map = {}

        print(f"📦 Найдено {len(unique_regions)} областей. Добавляем в базу...")
        for r_name in unique_regions:
            # Применяем .title(): "АВТОНОМНА РЕСПУБЛІКА КРИМ" -> "Автономна Республіка Крим"
            pretty_region_name = r_name.title()

            # Проверяем, есть ли уже такая область в базе (защита от дублей)
            result = await session.execute(select(Region).where(Region.name == pretty_region_name))
            region = result.scalars().first()

            if not region:
                region = Region(name=pretty_region_name)
                session.add(region)
                await session.flush()  # Сохраняем в БД, чтобы сразу получить region.id

            # Запоминаем ID для этой области
            region_map[r_name] = region.id

        print("🏙 Подготавливаем населенные пункты...")
        localities_to_add = []
        for item in data:
            r_name = item.get("region")
            loc_name = item.get("object_name")

            # Пропускаем кривые записи без региона или названия
            if not r_name or not loc_name:
                continue

                # Применяем .title(): "ГРЕСІВСЬКИЙ" -> "Гресівський"
            pretty_loc_name = loc_name.title()

            locality = Locality(
                name=pretty_loc_name,
                type=item.get("object_category", ""),  # "СМТ", "Місто", "Село"
                region_id=region_map[r_name]  # Привязываем к правильной области
            )
            localities_to_add.append(locality)

        print(f"🚀 Сохраняем {len(localities_to_add)} населенных пунктов (это займет пару секунд)...")
        # add_all позволяет сохранить все 30 000+ записей одним мощным запросом
        session.add_all(localities_to_add)
        await session.commit()

        print("✅ База данных успешно заполнена населенными пунктами!")


if __name__ == "__main__":
    asyncio.run(seed_data())