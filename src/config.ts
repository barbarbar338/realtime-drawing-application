import { config } from "dotenv";

config();

export const CONFIG = {
	PORT: parseInt(process.env.PORT as string),
	REDIS_HOST: process.env.REDIS_HOST,
	REDIS_PORT: parseInt(process.env.REDIS_PORT as string),
	REDIS_PASSWORD: process.env.REDIS_PASSWORD,
};
