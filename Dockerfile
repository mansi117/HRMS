# FROM  python:3.12

# WORKDIR /app
# COPY . /app

# RUN pip install poetry
# RUN poetry install --root

# EXPOSE 8000

# # CMD ["poetry", "run", "gunicorn", "app:app"]
# # CMD ["poetry", "run", "gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "app:app/app.py"]
# # CMD ["poetry", "run", "python", "app/app.py"]
# # CMD ["poetry", "run", "python", "app/app.py"]
# CMD ["poetry", "run", "gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "app.app:app"]


# FROM python:3.12

# WORKDIR /app

# # COPY . /app  # ✅ Ensure this copies the entire project, including templates
# COPY ["./", "/app/"]

# RUN pip install -r requirements.txt

# EXPOSE 8000

# # CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "app.app:app"]
# FROM python:3.9-slim

# WORKDIR /app

# COPY . /app

# RUN pip install -r requirements.txt
# RUN pip install --upgrade pip


# CMD ["gunicorn", "app.app:app", "--bind", "0.0.0.0:8000"]
# Use a lightweight Python image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Copy only requirements.txt first for caching benefits
COPY requirements.txt /app/

# Install system dependencies for some Python packages
RUN apt-get update && apt-get install -y \
    build-essential libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip before installing dependencies
RUN pip install --upgrade pip

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the app files
COPY . /app

# Run Gunicorn to start the app
CMD ["gunicorn", "app.app:app", "--bind", "0.0.0.0:8000"]
