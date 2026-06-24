# Stage 1: Build
FROM node:20-slim as build-stage
WORKDIR /app

# 安裝基本的構建工具
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# 拷貝 package 檔案
COPY package*.json ./

# 自動辨識架構並安裝依賴
RUN ARCH=$(uname -m) && \
    EXTRA_PKGS="" && \
    if [ "$ARCH" = "aarch64" ]; then \
        EXTRA_PKGS="@rollup/rollup-linux-arm64-gnu lightningcss-linux-arm64-gnu @tailwindcss/oxide-linux-arm64-gnu"; \
    elif [ "$ARCH" = "x86_64" ]; then \
        EXTRA_PKGS="@rollup/rollup-linux-x64-gnu lightningcss-linux-x64-gnu @tailwindcss/oxide-linux-x64-gnu"; \
    fi && \
    npm install --legacy-peer-deps $EXTRA_PKGS

# 拷貝源碼
COPY . .

# 執行編譯 (會產出 dist/server.cjs 和 dist/index.html)
RUN npm run build

# Stage 2: Run
# 不再使用 Nginx，直接使用 Node 運行編譯後的 server.cjs
FROM node:20-slim
WORKDIR /app
COPY --from=build-stage /app/dist ./dist
COPY --from=build-stage /app/package.json ./package.json
COPY --from=build-stage /app/node_modules ./node_modules

EXPOSE 3000
ENV NODE_ENV=production

# 啟動命令
CMD ["node", "dist/server.cjs"]
