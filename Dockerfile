FROM  python:3.12

WORKDIR /app
COPY . /app

RUN pip install poetry
RUN poetry install --no-root

EXPOSE 8000

# CMD ["poetry", "run", "gunicorn", "app:app"]
CMD ["poetry", "run", "gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "app:app"]
