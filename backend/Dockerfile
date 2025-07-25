# syntax=docker/dockerfile:1

ARG PYTHON_VERSION=3.13.2
FROM python:${PYTHON_VERSION}-slim as base

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Create a non-privileged user that the app will run under.
# This step creates the user but doesn't switch to it yet.
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

# Download dependencies as root (default user at this point)
RUN --mount=type=cache,target=/root/.cache/pip \
    --mount=type=bind,source=requirements.txt,target=requirements.txt \
    python -m pip install -r requirements.txt

# Copy the source code into the container as root.
# The copied files will initially be owned by root.
COPY . .

# Set correct ownership for the entire /app directory to your non-root user.
# This ensures `appuser` has read/write permissions on all app files and subdirectories.
# Assuming 'appuser' is in a group also named 'appuser' (default for adduser without --ingroup)
RUN chown -R appuser:appuser /app

# Create the staticfiles directory and set permissions as root.
# This ensures it exists and is writable, ready for `collectstatic` to populate it.
# Even though `chown` was done, creating the directory explicitly as root first ensures it's there.
RUN mkdir -p /app/staticfiles && chmod -R 777 /app/staticfiles

# --- Now, switch to the non-privileged user for running the application and future commands ---
USER appuser

# Expose the port that the application listens on.
EXPOSE 8000

# Run the application.
CMD gunicorn 'core.wsgi' --bind=0.0.0.0:8000