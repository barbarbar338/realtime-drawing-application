FROM node:16-alpine AS builder

WORKDIR /app
COPY . .

RUN yarn install --frozen-lockfile

RUN yarn build

FROM node:16-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 draw

COPY --from=builder /app ./

USER draw

CMD ["yarn", "start"]
