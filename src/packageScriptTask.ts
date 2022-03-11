import { detect } from "detect-package-manager";

import { ProcessTask } from "./processTask";

import { type RunResult, Task, type StopOptions } from "./task";

type PackageScriptOptions = {
	script: string;
};

export class PackageScriptTask extends Task {
	static override taskType = "package-script";

	private _processTask?: ProcessTask;
	constructor(name: string, private options: PackageScriptOptions) {
		super(name);
	}

	async run(): Promise<RunResult> {
		const packageManager = await detect();

		this._processTask = new ProcessTask(this.name, {
			command: packageManager,
			args: ["run", this.options.script],
		});

		return await this._processTask.run();
	}

	async stop(options: StopOptions): Promise<void> {
		await this._processTask?.stop(options);

		delete this._processTask;
	}
}
