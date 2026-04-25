import fs from "node:fs";
import path from "node:path";

function getAppVersion() {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8")) as { version?: string };
    const deploymentVersion =
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.VERCEL_DEPLOYMENT_ID ||
        process.env.VERCEL_URL ||
        "local";

    return `${packageJson.version ?? "0.0.0"}-${deploymentVersion}`;
}

export default function handler(_request: Request, response: { setHeader: (key: string, value: string) => void; status: (code: number) => { json: (body: unknown) => void } }) {
    response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.setHeader("Pragma", "no-cache");
    response.setHeader("Expires", "0");

    response.status(200).json({
        version: getAppVersion(),
    });
}
