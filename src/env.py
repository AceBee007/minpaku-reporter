from pydantic_settings import BaseSettings


class EnvConfig(BaseSettings):
    username: str
    password: str
    retry_attempt: int

    class Config:
        env_file = ".env"
