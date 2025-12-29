FROM postgres:latest

RUN apt-get update && apt-get install -y \
    postgresql-18-cron \
    && rm -rf /var/lib/apt/lists/*
