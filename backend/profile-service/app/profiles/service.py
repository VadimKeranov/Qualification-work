from sqlalchemy.ext.asyncio import AsyncSession
from app.profiles.repository import ProfileRepository
from app.profiles.schemas import JobSeekerUpdate, CompanyUpdate, CompanyProfileWithVacancies

import httpx

class ProfileService:
    @staticmethod
    async def get_my_seeker_profile(session: AsyncSession, user_id: int):
        return await ProfileRepository.get_seeker_by_user_id(session, user_id)

    @staticmethod
    async def update_my_seeker_profile(session: AsyncSession, user_id: int, data: JobSeekerUpdate):
        return await ProfileRepository.upsert_seeker(session, user_id, data)

    @staticmethod
    async def get_my_company_profile(session: AsyncSession, user_id: int):
        return await ProfileRepository.get_company_by_user_id(session, user_id)

    @staticmethod
    async def update_my_company_profile(session: AsyncSession, user_id: int, data: CompanyUpdate):
        return await ProfileRepository.upsert_company(session, user_id, data)

    @staticmethod
    async def get_my_company_profile_with_vacancies(session: AsyncSession, user_id: int):
        # 1. Получаем профиль компании из нашей БД
        profile = await ProfileRepository.get_company_by_user_id(session, user_id)
        if not profile:
            return None

        # 2. Асинхронно запрашиваем вакансии у vacancy-service
        vacancies = []
        try:
            # Мы знаем company_id, так как он совпадает с user_id в нашей архитектуре
            # В реальном мире здесь будет URL из конфига
            async with httpx.AsyncClient() as client:
                response = await client.get(f"http://localhost:8001/vacancies/by-company/{profile.user_id}")
                # Убедитесь, что порт 8001 верный для vacancy-service

                if response.status_code == 200:
                    vacancies = response.json()
        except httpx.RequestError as e:
            # Если vacancy-service недоступен, мы не падаем, а просто логируем ошибку
            # и возвращаем профиль с пустым списком вакансий.
            print(f"Could not fetch vacancies: {e}")

        # 3. Собираем финальный ответ
        response_data = profile.__dict__
        response_data["vacancies"] = vacancies

        return CompanyProfileWithVacancies.model_validate(response_data)
