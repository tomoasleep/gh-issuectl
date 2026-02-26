import { type Executor, exec } from "../github/api.js";
import { patchSection, SectionNotFoundError } from "../markdown/section.js";

async function readContentFromStdin(): Promise<string> {
	const chunks: Uint8Array[] = [];
	const reader = Bun.stdin.stream().getReader();

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		chunks.push(value);
	}

	return Buffer.concat(chunks).toString("utf-8").trim();
}

async function detectCurrentPR(
	executor: Executor = exec,
): Promise<number | null> {
	const { stdout, exitCode } = await executor([
		"gh",
		"pr",
		"view",
		"--json",
		"number",
	]);

	if (exitCode !== 0) {
		return null;
	}

	const pr = JSON.parse(stdout);
	return pr.number;
}

async function getItem(
	number: number,
	executor: Executor = exec,
): Promise<{
	type: "issue" | "pr";
	number: number;
	title: string;
	body: string | null;
}> {
	const { stdout, exitCode } = await executor([
		"gh",
		"issue",
		"view",
		String(number),
		"--json",
		"number,title,body",
	]);

	if (exitCode === 0) {
		return { type: "issue", ...JSON.parse(stdout) };
	}

	const prResult = await executor([
		"gh",
		"pr",
		"view",
		String(number),
		"--json",
		"number,title,body",
	]);

	if (prResult.exitCode === 0) {
		return { type: "pr", ...JSON.parse(prResult.stdout) };
	}

	throw new Error(`Item ${number} not found as issue or PR`);
}

async function updateItem(
	type: "issue" | "pr",
	number: number,
	body: string,
	executor: Executor = exec,
): Promise<void> {
	const cmd =
		type === "issue"
			? ["gh", "issue", "edit", String(number), "--body", body]
			: ["gh", "pr", "edit", String(number), "--body", body];

	const { exitCode } = await executor(cmd);

	if (exitCode !== 0) {
		throw new Error(`Failed to update ${type} ${number}`);
	}
}

export async function patch(
	number?: number,
	section?: string,
	content?: string,
): Promise<void> {
	if (!section) {
		console.error("Error: Section is required");
		process.exit(1);
	}

	if (!content) {
		if (process.stdin.isTTY) {
			console.error("Error: Content must be provided as argument or via stdin");
			process.exit(1);
		}
		content = await readContentFromStdin();
	}

	let targetNumber: number;

	if (number) {
		targetNumber = number;
	} else {
		const prNumber = await detectCurrentPR();
		if (!prNumber) {
			console.error("No pull request found for current branch");
			process.exit(1);
		}
		targetNumber = prNumber;
		console.log(`Detected PR #${targetNumber} for current branch`);
	}

	try {
		const item = await getItem(targetNumber);

		if (item.body === null) {
			console.error(
				`${item.type.toUpperCase()} #${targetNumber} has no description`,
			);
			process.exit(1);
		}

		const newBody = patchSection(item.body, section, content);
		await updateItem(item.type, targetNumber, newBody);

		console.log(
			`Updated section "${section}" in ${item.type} #${targetNumber}`,
		);
	} catch (error) {
		if (error instanceof SectionNotFoundError) {
			console.error(`Section "${section}" not found`);
			process.exit(1);
		}
		throw error;
	}
}
