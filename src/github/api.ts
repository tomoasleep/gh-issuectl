export type ExecResult = {
	stdout: string;
	stderr: string;
	exitCode: number;
};

export type Executor = (cmd: string[], stdin?: string) => Promise<ExecResult>;

export const exec: Executor = async (cmd: string[], stdinData?: string) => {
	const process = Bun.spawn(cmd, {
		stdin: stdinData ? new TextEncoder().encode(stdinData) : undefined,
		stdout: "pipe",
		stderr: "pipe",
	});

	const stdout = await new Response(process.stdout).text();
	const stderr = await new Response(process.stderr).text();
	const exitCode = await process.exited;

	return { stdout, stderr, exitCode };
};

export interface Issue {
	number: number;
	title: string;
	body: string | null;
}

export interface PR {
	number: number;
	title: string;
	body: string | null;
}

export async function getIssue(
	number: number,
	executor: Executor = exec,
): Promise<Issue> {
	const { stdout, exitCode } = await executor([
		"gh",
		"issue",
		"view",
		String(number),
		"--json",
		"number,title,body",
	]);

	if (exitCode !== 0) {
		throw new Error(`Failed to get issue ${number}`);
	}

	return JSON.parse(stdout);
}

export async function updateIssue(
	number: number,
	body: string,
	executor: Executor = exec,
): Promise<void> {
	const { exitCode } = await executor([
		"gh",
		"issue",
		"edit",
		String(number),
		"--body",
		body,
	]);

	if (exitCode !== 0) {
		throw new Error(`Failed to update issue ${number}`);
	}
}

export async function getPR(
	number: number,
	executor: Executor = exec,
): Promise<PR> {
	const { stdout, exitCode } = await executor([
		"gh",
		"pr",
		"view",
		String(number),
		"--json",
		"number,title,body",
	]);

	if (exitCode !== 0) {
		throw new Error(`Failed to get PR ${number}`);
	}

	return JSON.parse(stdout);
}

export async function updatePR(
	number: number,
	body: string,
	executor: Executor = exec,
): Promise<void> {
	const { exitCode } = await executor([
		"gh",
		"pr",
		"edit",
		String(number),
		"--body",
		body,
	]);

	if (exitCode !== 0) {
		throw new Error(`Failed to update PR ${number}`);
	}
}
