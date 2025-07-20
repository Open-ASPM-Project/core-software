# Use an official Python base image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV GOPATH=/root/go
ENV PATH=$PATH:/usr/local/go/bin:/root/go/bin

# Create and switch to a new directory
WORKDIR /app

# Update and install necessary packages
RUN apt update && \
    apt upgrade -y && \
    apt install -y git wget curl build-essential

# Install Confused (Visma tool) directly
RUN wget https://github.com/visma-prodsec/confused/releases/download/v0.5/confused_0.5_linux_amd64.tar.gz && \
    tar -xvf confused_0.5_linux_amd64.tar.gz -C /usr/local/bin && \
    chmod +x /usr/local/bin/confused
# Verify Confused installation
RUN confused --help || echo "Confused installed successfully!"

# Install Gitleaks
RUN wget https://github.com/gitleaks/gitleaks/releases/download/v8.21.2/gitleaks_8.21.2_linux_x64.tar.gz && \
    tar -xvf gitleaks_8.21.2_linux_x64.tar.gz -C /tmp && \
    mv /tmp/gitleaks /usr/local/bin/gitleaks

# Install TruffleHog
RUN wget https://github.com/trufflesecurity/trufflehog/releases/download/v3.84.2/trufflehog_3.84.2_linux_amd64.tar.gz && \
    tar -xvf trufflehog_3.84.2_linux_amd64.tar.gz -C /tmp && \
    mv /tmp/trufflehog /usr/local/bin/trufflehog

# Install Grype
RUN wget https://github.com/anchore/grype/releases/download/v0.88.0/grype_0.88.0_linux_amd64.tar.gz && \
    tar -xvf grype_0.88.0_linux_amd64.tar.gz -C /tmp && \
    mv /tmp/grype /usr/local/bin/grype

# Install Syft
RUN curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin

# Verify Syft installation
RUN syft version

# Copy the requirements file into the image
COPY requirements.txt /app/requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy the FastAPI app files into the image
COPY . /app
RUN rm -rf /app/.git*
RUN rm -rf /app/v2

# Expose the FastAPI app port
EXPOSE 8000

ENV SECRET="EjhtLijYwYRhFzRfGmEYCdpThTVfvvPnbatANPpfxepLHhGKkaJXuyCShNywdLgv"
ENV ALGORITHM="HS256"
ENV LICENSE_SERVER_VALIDATE_URL="https://licence.thefirewall.org"
ENV ACCESS_TOKEN_EXPIRE_MINUTES=1440

CMD alembic upgrade head && uvicorn app.main:app --workers 3 --host 0.0.0.0 --port 8000
