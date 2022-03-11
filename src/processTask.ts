import { type ChildProcess, spawn, type SpawnOptions } from "child_process";

import { type RunResult, buildRunSuccess, Task, buildRunFailure, buildRunCancelled, type StopOptions } from "./task";

type ProcessOptions = {
	command: string;
	args?: readonly string[];
	options?: SpawnOptions;
};

export class ProcessTask extends Task {
	static override taskType = "package-script";

	private _packageProcess?: ChildProcess;
	private _resolve?: (value: RunResult) => void;
	constructor(name: string, private options: ProcessOptions) {
		super(name);
	}

	async run(): Promise<RunResult> {
		return await new Promise((resolve) => {
			this._resolve = resolve;

			const { command, args, options } = this.options;

			if (typeof args === "undefined") {
				this._packageProcess = spawn(command);
			} else if (typeof options === "undefined") {
				this._packageProcess = spawn(command, args);
			} else {
				this._packageProcess = spawn(command, args, options);
			}

			this._packageProcess.on("exit", (code, signal) => {
				delete this._resolve;
				delete this._packageProcess;

				if (signal !== null) {
					return;
				}

				if (code === 0) {
					resolve(buildRunSuccess());
				} else {
					resolve(buildRunFailure(`Process exited with code ${code}`));
				}
			});
		});
	}

	async stop(options: StopOptions): Promise<void> {
		// Resolves the `run` function so that it's not kept around.
		this._resolve?.(buildRunCancelled());
		delete this._resolve;

		const packageProcess = this._packageProcess;
		delete this._packageProcess;

		if (typeof packageProcess !== "undefined") {
			let shutdownTimeout: NodeJS.Timeout | undefined;
			if (options.stopTimeout === 0) {
				packageProcess.kill("SIGTERM");
			} else {
				// Start with a signal for a graceful shutdown
				packageProcess.kill("SIGINT");

				if (options.stopTimeout !== -1) {
					shutdownTimeout = setTimeout(() => {
						packageProcess.kill("SIGTERM");
					}, options.stopTimeout * 1000);
				}
			}

			// Wait for the process to exit.
			await new Promise<void>((resolve) => {
				packageProcess.on("exit", () => {
					if (typeof shutdownTimeout !== "undefined") {
						clearTimeout(shutdownTimeout);
					}

					resolve();
				});
			});
		}
	}
}
