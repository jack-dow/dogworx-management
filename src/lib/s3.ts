import S3 from "aws-sdk/clients/s3";

import { env } from "~/env.mjs";

const s3 = new S3({
	apiVersion: "2006-03-01",
	accessKeyId: env.AWS_S3_ACCESS_KEY,
	secretAccessKey: env.AWS_S3_SECRET_KEY,
	region: env.AWS_S3_REGION,
	signatureVersion: "v4",
});

export { s3 };
