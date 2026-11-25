from app.main import app

# Expose app for Vercel Serverless / ASGI runtime
__all__ = ["app"]
