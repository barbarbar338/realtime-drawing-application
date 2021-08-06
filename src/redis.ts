import { createAdapter } from "socket.io-redis";
import { createNodeRedisClient } from "handy-redis";
import { CONFIG } from "./config";

export const redis = createNodeRedisClient({
	host: CONFIG.REDIS_HOST,
	port: CONFIG.REDIS_PORT,
	password: CONFIG.REDIS_PASSWORD,
});
export const pubClient = redis.nodeRedis;
export const subClient = pubClient.duplicate();
export const redisAdapter = createAdapter({ pubClient, subClient });

export const set = (key: string, value: Record<any, any>) =>
	redis.set(key, JSON.stringify(value));
export const get = async (key: string) =>
	JSON.parse((await redis.get(key)) || "{}");
export const has = async (key: string) => !!(await redis.get(key));
export const del = (key: string) => redis.del(key);
