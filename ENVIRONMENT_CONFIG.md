# 环境配置说明

本项目使用 `cross-env` 来管理不同环境的配置。

## 环境类型

### 1. 开发环境 (dev)
- **命令**: `npm run dev`
- **API 地址**: `http://localhost:8000`
- **用途**: 本地开发，连接本地后端服务

### 2. 生产环境 (prod)
- **命令**: `npm run prod`
- **API 地址**: `https://chuangningpeixun.com`
- **用途**: 生产环境，连接线上后端服务

## 可用脚本

```bash
# 开发环境 - 连接 localhost:8000
npm run dev

# 生产环境 - 连接 https://chuangningpeixun.com
npm run prod

# 构建开发版本
npm run build:dev

# 构建生产版本
npm run build:prod
```

## 环境变量

### .env.development
```
VITE_API_ENV=dev
VITE_USE_MOCK=false
```

### .env.production
```
VITE_API_ENV=prod
VITE_USE_MOCK=false
```

## 配置文件

主要配置在 `src/hooks/useApi.ts` 中：

```typescript
const API_CONFIG = {
  MOCK: 'mock',
  LOCAL: 'http://localhost:8000',
  PRODUCTION: 'https://chuangningpeixun.com'
} as const;
```

## 使用说明

1. **开发时**: 使用 `npm run dev`，会自动连接到 `localhost:8000`
2. **生产预览**: 使用 `npm run prod`，会连接到生产环境 API
3. **构建部署**: 使用 `npm run build:prod` 构建生产版本

## 注意事项

- 确保本地开发时后端服务运行在 `localhost:8000`
- 生产环境会连接到 `https://chuangningpeixun.com`
- 如需修改 API 地址，请编辑 `src/hooks/useApi.ts` 中的 `API_CONFIG`
