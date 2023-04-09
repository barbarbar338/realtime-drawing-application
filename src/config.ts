import { config } from "dotenv";

config();

export const CONFIG = {
	PORT: parseInt(process.env.PORT as string),
};
