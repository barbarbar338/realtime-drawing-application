import { config } from "dotenv";
import { Pika } from "pika-id";

config();

export const CONFIG = {
	PORT: parseInt(process.env.PORT as string),
	PIKA: new Pika(
		[
			{
				prefix: "user",
				description: "User ID",
			},
		],
		{
			epoch: new Date("2020-02-10T21:00:00.000Z").getTime(),
		},
	),
};
