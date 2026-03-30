class HealthService:

    @staticmethod
    async def check() -> dict:
        return {
            "status": "ok",
            "service": "api-gateway"
        }