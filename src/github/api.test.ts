import { describe, expect, it, mock } from "bun:test";
import {
	type ExecResult,
	type Executor,
	getIssue,
	getPR,
	updateIssue,
	updatePR,
} from "./api";

describe("GitHub API", () => {
	const createMockExecutor = (
		stdout: string = "",
		stderr: string = "",
		exitCode: number = 0,
	): Executor => {
		return mock(async (): Promise<ExecResult> => {
			return { stdout, stderr, exitCode };
		});
	};

	describe("getIssue", () => {
		it("should fetch issue by number", async () => {
			const mockIssue = {
				number: 123,
				title: "Test Issue",
				body: "## What\n\nContent",
			};

			const executor = createMockExecutor(JSON.stringify(mockIssue));
			const result = await getIssue(123, executor);

			expect(result.number).toBe(123);
			expect(result.title).toBe("Test Issue");
			expect(result.body).toBe("## What\n\nContent");
			expect(executor).toHaveBeenCalledTimes(1);
		});

		it("should throw on failure", async () => {
			const executor = createMockExecutor("", "Issue not found", 1);

			await expect(getIssue(999, executor)).rejects.toThrow(
				"Failed to get issue 999",
			);
		});

		it("should handle null body", async () => {
			const mockIssue = {
				number: 123,
				title: "Test Issue",
				body: null,
			};

			const executor = createMockExecutor(JSON.stringify(mockIssue));
			const result = await getIssue(123, executor);

			expect(result.body).toBeNull();
		});
	});

	describe("updateIssue", () => {
		it("should update issue body", async () => {
			const executor = createMockExecutor();
			await updateIssue(123, "New body", executor);

			expect(executor).toHaveBeenCalledTimes(1);
		});

		it("should throw on failure", async () => {
			const executor = createMockExecutor("", "Permission denied", 1);

			await expect(updateIssue(123, "New body", executor)).rejects.toThrow(
				"Failed to update issue 123",
			);
		});
	});

	describe("getPR", () => {
		it("should fetch PR by number", async () => {
			const mockPR = {
				number: 456,
				title: "Test PR",
				body: "## What\n\nContent",
			};

			const executor = createMockExecutor(JSON.stringify(mockPR));
			const result = await getPR(456, executor);

			expect(result.number).toBe(456);
			expect(result.title).toBe("Test PR");
			expect(result.body).toBe("## What\n\nContent");
			expect(executor).toHaveBeenCalledTimes(1);
		});

		it("should throw on failure", async () => {
			const executor = createMockExecutor("", "PR not found", 1);

			await expect(getPR(999, executor)).rejects.toThrow(
				"Failed to get PR 999",
			);
		});
	});

	describe("updatePR", () => {
		it("should update PR body", async () => {
			const executor = createMockExecutor();
			await updatePR(456, "New body", executor);

			expect(executor).toHaveBeenCalledTimes(1);
		});

		it("should throw on failure", async () => {
			const executor = createMockExecutor("", "Permission denied", 1);

			await expect(updatePR(456, "New body", executor)).rejects.toThrow(
				"Failed to update PR 456",
			);
		});
	});
});
