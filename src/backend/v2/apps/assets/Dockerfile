FROM node:20

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm nx && pnpm install

COPY . .

# Prepare app files, install dependencies, setup tools and build
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    git \
    jq \
    nmap \
    pipx \
    python3 \
    python3-pip \
    sudo \
    unzip \
    wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* && \
    # Install Google Chrome
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list && \
    apt-get update && apt-get install -y google-chrome-stable && apt-get clean && rm -rf /var/lib/apt/lists/* && \
    # Install gowitness
    mkdir -p /tmp/tools/gowitness && \
    cd /tmp/tools/gowitness && \
    wget https://github.com/sensepost/gowitness/releases/download/3.0.5/gowitness-3.0.5-linux-amd64 && \
    mv gowitness-3.0.5-linux-amd64 /usr/local/bin/gowitness && \
    chmod +x /usr/local/bin/gowitness && \
    # Install cloudlist using pre-built binary
    mkdir -p /tmp/tools/cloudlist && \
    cd /tmp/tools/cloudlist && \
    wget https://github.com/projectdiscovery/cloudlist/releases/download/v1.2.2/cloudlist_1.2.2_linux_amd64.zip && \
    unzip cloudlist_1.2.2_linux_amd64.zip && \
    mv cloudlist /usr/local/bin/ && \
    chmod +x /usr/local/bin/cloudlist && \
    # Install httpx using pre-built binary
    mkdir -p /tmp/tools/httpx && \
    cd /tmp/tools/httpx && \
    wget https://github.com/projectdiscovery/httpx/releases/download/v1.6.10/httpx_1.6.10_linux_amd64.zip && \
    unzip httpx_1.6.10_linux_amd64.zip && \
    mv httpx /usr/local/bin/ && \
    chmod +x /usr/local/bin/httpx && \
    # Install steampipe_export_aws from Turbot official release
    mkdir -p /tmp/tools/steampipe_export_aws && \
    cd /tmp/tools/steampipe_export_aws && \
    wget https://github.com/turbot/steampipe-plugin-aws/releases/download/v1.12.0/steampipe_export_aws.linux_amd64.tar.gz && \
    tar -xzf steampipe_export_aws.linux_amd64.tar.gz && \
    mv steampipe_export_aws /usr/local/bin/ && \
    chmod +x /usr/local/bin/steampipe_export_aws && \
    # Install Katana
    mkdir -p /tmp/tools/katana && \
    cd /tmp/tools/katana && \
    wget https://github.com/projectdiscovery/katana/releases/download/v1.1.3/katana_1.1.3_linux_amd64.zip && \
    unzip katana_1.1.3_linux_amd64.zip && \
    mv katana /usr/local/bin/ && \
    chmod +x /usr/local/bin/katana && \
    # Install Uro using pipx
    pipx install uro && \
    # Refresh sources to ensure uro is available
    export PATH="$PATH:/root/.local/bin" && \
    # Clean up
    rm -rf /tmp/tools && \
    # Verify installations
    cloudlist -version -silent && httpx -version -silent && gowitness version && katana -version

# Build the specific app using Nx
RUN pnpm nx build assets

# Expose the app's port (adjust as necessary)
EXPOSE 3000

# Start the application
ENV SECRET="EjhtLijYwYRhFzRfGmEYCdpThTVfvvPnbatANPpfxepLHhGKkaJXuyCShNywdLgv"
ENV ALGORITHM="HS256"
ENV LICENSE_SERVER_VALIDATE_URL="https://licence.thefirewall.org"
ENV ACCESS_TOKEN_EXPIRE_MINUTES=1440
ENV RABBITMQ_URL="amqp://rabbitmq:5672"

# Create startup script
RUN echo '#!/bin/bash\npnpm nx migration:run assets && node dist/apps/assets/main.js' > /usr/src/app/start.sh && \
    chmod +x /usr/src/app/start.sh

CMD ["/usr/src/app/start.sh"]